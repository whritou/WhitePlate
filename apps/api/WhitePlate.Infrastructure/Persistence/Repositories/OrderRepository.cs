using System.Text.Json;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Orders;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrderRepository(WhitePlateDbContext database,
    ICatalogPublicationRepository catalogPublications) : IOrderRepository
{
    private static readonly JsonSerializerOptions ReceiptJson = new(JsonSerializerDefaults.Web);

    public async Task<IdempotencyResult> FindIdempotentOrderAsync(Guid tenantId, string keyHash,
        string requestHash, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var existing = await database.OrderIdempotencyRecords.AsNoTracking().SingleOrDefaultAsync(record =>
            record.TenantId == tenantId && record.KeyHash == keyHash, cancellationToken);
        return ResolveExisting(existing, requestHash, now);
    }

    public async Task<CheckoutLocaleDto?> ResolveCheckoutLocaleAsync(Guid tenantId, string? requestedLocale,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tenantId && item.IsActive && database.Organizations.Any(organization =>
                organization.Id == item.OrganizationId && organization.IsActive), cancellationToken);
        if (tenant is null) return null;

        var published = await catalogPublications.GetPublishedCatalogAsync(tenantId, cancellationToken);
        if (published is not null)
        {
            var publishedLocale = MenuLocale.TryCreate(requestedLocale, out var normalized) &&
                                  published.Locales.Contains(normalized!.Value, StringComparer.OrdinalIgnoreCase)
                ? normalized.Value
                : published.DefaultLocale;
            return new CheckoutLocaleDto(publishedLocale, published.DefaultLocale);
        }

        var locale = tenant.SupportsMenuLocale(requestedLocale) ?
            WhitePlate.Domain.Tenants.MenuLocale.Create(requestedLocale).Value : tenant.DefaultMenuLocale;
        return new CheckoutLocaleDto(locale, tenant.DefaultMenuLocale);
    }

    public async Task<PickupAvailabilityDto> GetPickupSlotsAsync(Guid tenantId,
        DateTimeOffset now, CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().SingleOrDefaultAsync(item => item.Id == tenantId &&
            item.IsActive && database.Organizations.Any(organization => organization.Id == item.OrganizationId && organization.IsActive),
            cancellationToken);
        if (tenant is null) return new PickupAvailabilityDto("schedule_not_configured", null, []);
        var rushBufferMinutes = tenant.RushHoldEnabled ? WhitePlate.Domain.Tenants.Tenant.RushHoldBufferMinutes : 0;
        if (!tenant.AcceptingOrders)
            return Availability("orders_paused", tenant, [], rushBufferMinutes);
        if (tenant.GetOpeningHours() is null)
            return Availability("schedule_not_configured", tenant, [], rushBufferMinutes);
        var slots = tenant.GeneratePickupSlots(now);
        if (slots.Count == 0) return Availability("no_slots_available", tenant, [], rushBufferMinutes);
        var slotTicks = slots.Select(slot => slot.StartsAt.UtcDateTime.Ticks).ToArray();
        var counts = await database.PickupSlotUsages.AsNoTracking().Where(usage => usage.TenantId == tenantId &&
                slotTicks.Contains(usage.SlotStartTicks))
            .ToDictionaryAsync(usage => usage.SlotStartTicks, usage => usage.ReservedCount, cancellationToken);
        var capacity = tenant.GetPickupScheduling().Capacity;
        var available = slots.Select(slot => slot with
                { RemainingCapacity = Math.Max(0, capacity - counts.GetValueOrDefault(slot.StartsAt.UtcDateTime.Ticks)) })
            .Where(slot => slot.RemainingCapacity > 0).ToArray();
        return Availability(available.Length > 0 ? "available" : "no_slots_available", tenant,
            available, rushBufferMinutes);
    }

    public async Task<CheckoutCatalogDto> GetCheckoutCatalogAsync(Guid tenantId,
        string locale, string defaultLocale, IReadOnlyCollection<Guid> productIds, string? discountCode,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().Where(tenant => tenant.Id == tenantId && tenant.IsActive &&
                database.Organizations.Any(organization => organization.Id == tenant.OrganizationId && organization.IsActive))
            .Select(tenant => new { tenant.Currency, tenant.TimeZone }).SingleOrDefaultAsync(cancellationToken);
        if (tenant is null) return new CheckoutCatalogDto(string.Empty, locale, [], null);

        var published = await catalogPublications.GetPublishedCatalogAsync(tenantId, cancellationToken);
        if (published is not null)
            return BuildPublishedCheckoutCatalog(published, tenant.TimeZone, locale, defaultLocale,
                productIds, discountCode);

        var products = await database.Products.AsNoTracking().Where(product => product.TenantId == tenantId &&
                productIds.Contains(product.Id) && product.IsAvailable && !product.IsArchived &&
                database.MenuCategories.Any(category => category.TenantId == tenantId &&
                    category.Id == product.CategoryId && !category.IsArchived && category.IsVisible))
            .OrderBy(product => product.Id)
            .Select(product => new
            {
                product.Id, product.Name, product.TranslationsJson, product.BasePrice, product.TaxRatePercent,
                product.ContainsAllergensJson, product.MayContainAllergensJson, product.DietaryTagsJson,
                product.PreparationMinutes, product.PreparationNotesJson
            })
            .ToListAsync(cancellationToken);
        var ids = products.Select(product => product.Id).ToArray();
        var groups = await database.ProductOptionGroups.AsNoTracking().Where(group => group.TenantId == tenantId &&
                ids.Contains(group.ProductId) && !group.IsArchived)
            .OrderBy(group => group.SortOrder).ThenBy(group => group.Id)
            .Select(group => new { group.Id, group.ProductId, group.MinimumSelections, group.MaximumSelections })
            .ToListAsync(cancellationToken);
        var groupIds = groups.Select(group => group.Id).ToArray();
        var options = await database.ProductOptions.AsNoTracking().Where(option => option.TenantId == tenantId &&
                groupIds.Contains(option.GroupId) && !option.IsArchived)
            .OrderBy(option => option.SortOrder).ThenBy(option => option.Id)
            .Select(option => new
            {
                option.Id, option.GroupId, option.Name, option.TranslationsJson, option.PriceAdjustment
            })
            .ToListAsync(cancellationToken);
        var checkoutProducts = products.Select(product => new CheckoutProductDto(product.Id,
            WhitePlate.Domain.Catalog.CatalogTranslations.Get(product.TranslationsJson, locale, defaultLocale,
                product.Name).Name,
            product.BasePrice, product.TaxRatePercent, groups.Where(group => group.ProductId == product.Id)
                .Select(group => new CheckoutOptionGroupDto(group.Id, group.MinimumSelections,
                    group.MaximumSelections, options.Where(option => option.GroupId == group.Id)
                        .Select(option => new CheckoutOptionDto(option.Id,
                            WhitePlate.Domain.Catalog.CatalogTranslations.Get(option.TranslationsJson, locale,
                                defaultLocale, option.Name).Name, option.PriceAdjustment)).ToArray()))
                .ToArray())
        {
            ContainsAllergens = System.Text.Json.JsonSerializer.Deserialize<string[]>(product.ContainsAllergensJson) ?? [],
            MayContainAllergens = System.Text.Json.JsonSerializer.Deserialize<string[]>(product.MayContainAllergensJson) ?? [],
            DietaryTags = System.Text.Json.JsonSerializer.Deserialize<string[]>(product.DietaryTagsJson) ?? [],
            PreparationMinutes = product.PreparationMinutes,
            PreparationNotes = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(product.PreparationNotesJson) ?? new()
        }).ToArray();

        var discount = string.IsNullOrWhiteSpace(discountCode) ? null : await database.PromotionDiscounts.AsNoTracking()
            .Where(item => item.TenantId == tenantId && item.Code == discountCode && item.IsActive)
            .Select(item => new CheckoutDiscountDto(item.Code, item.Kind, item.Value,
                item.MinimumOrderAmount, item.ExpiresOn))
            .SingleOrDefaultAsync(cancellationToken);
        return new CheckoutCatalogDto(tenant.Currency, locale, checkoutProducts, discount, tenant.TimeZone);
    }

    private static CheckoutCatalogDto BuildPublishedCheckoutCatalog(PublishedCatalogSnapshot catalog,
        string timeZone, string locale, string defaultLocale, IReadOnlyCollection<Guid> productIds,
        string? discountCode)
    {
        var categoryIds = catalog.Categories.Where(category => !category.IsArchived && category.IsVisible)
            .Select(category => category.Id).ToHashSet();
        var products = catalog.Products.Where(product => productIds.Contains(product.Id) && product.IsAvailable &&
            !product.IsArchived && categoryIds.Contains(product.CategoryId)).OrderBy(product => product.Id).ToArray();
        var ids = products.Select(product => product.Id).ToHashSet();
        var groups = catalog.OptionGroups.Where(group => ids.Contains(group.ProductId) && !group.IsArchived)
            .OrderBy(group => group.SortOrder).ThenBy(group => group.Id).ToArray();
        var groupIds = groups.Select(group => group.Id).ToHashSet();
        var options = catalog.Options.Where(option => groupIds.Contains(option.GroupId) && !option.IsArchived)
            .OrderBy(option => option.SortOrder).ThenBy(option => option.Id).ToArray();
        var checkoutProducts = products.Select(product => new CheckoutProductDto(product.Id,
            ResolveCatalogText(product.Name, product.Translations, locale, defaultLocale).Name,
            product.BasePrice, product.TaxRatePercent,
            groups.Where(group => group.ProductId == product.Id).Select(group => new CheckoutOptionGroupDto(
                group.Id, group.MinimumSelections, group.MaximumSelections,
                options.Where(option => option.GroupId == group.Id).Select(option => new CheckoutOptionDto(
                    option.Id, ResolveCatalogText(option.Name, option.Translations, locale, defaultLocale).Name,
                    option.PriceAdjustment)).ToArray())).ToArray())
        {
            ContainsAllergens = product.ContainsAllergens,
            MayContainAllergens = product.MayContainAllergens,
            DietaryTags = product.DietaryTags,
            PreparationMinutes = product.PreparationMinutes,
            PreparationNotes = product.PreparationNotes
        }).ToArray();

        var selectedDiscount = string.IsNullOrWhiteSpace(discountCode)
            ? null
            : catalog.Discounts.FirstOrDefault(discount => discount.IsActive &&
                string.Equals(discount.Code, discountCode, StringComparison.Ordinal));
        var discount = selectedDiscount is null ? null : new CheckoutDiscountDto(
            selectedDiscount.Code, Enum.TryParse<DiscountKind>(selectedDiscount.Kind, out var kind) ? kind : (DiscountKind)0,
            selectedDiscount.Value, selectedDiscount.MinimumOrderAmount, selectedDiscount.ExpiresOn);
        return new CheckoutCatalogDto(catalog.Currency, locale, checkoutProducts, discount, timeZone);
    }

    private static CatalogLocalizedText ResolveCatalogText(string name,
        IReadOnlyDictionary<string, CatalogLocalizedText> translations, string locale, string defaultLocale)
    {
        var translation = translations.FirstOrDefault(pair => string.Equals(pair.Key, locale,
            StringComparison.OrdinalIgnoreCase)).Value;
        translation ??= translations.FirstOrDefault(pair => string.Equals(pair.Key, defaultLocale,
            StringComparison.OrdinalIgnoreCase)).Value;
        return translation ?? new CatalogLocalizedText(name);
    }

    public async Task<IdempotencyResult> CreateOrderAsync(WhitePlate.Domain.Orders.Order order,
        OrderReceiptDto receipt, string keyHash, string requestHash, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var existing = await database.OrderIdempotencyRecords.SingleOrDefaultAsync(record =>
            record.TenantId == order.TenantId && record.KeyHash == keyHash, cancellationToken);
        var existingResult = ResolveExisting(existing, requestHash, now);
        if (existingResult.Outcome != IdempotencyOutcome.New)
        {
            await transaction.RollbackAsync(cancellationToken);
            return existingResult;
        }
        if (existing is not null) database.OrderIdempotencyRecords.Remove(existing);

        var tenantQuery = database.Database.IsNpgsql()
            ? database.Tenants.FromSqlInterpolated($"SELECT * FROM \"Tenants\" WHERE \"Id\" = {order.TenantId} FOR SHARE")
            : database.Tenants;
        var tenant = await tenantQuery.AsNoTracking().SingleAsync(item => item.Id == order.TenantId,
            cancellationToken);
        if (!tenant.AcceptingOrders)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new IdempotencyResult(IdempotencyOutcome.Conflict);
        }
        var capacity = tenant.GetPickupScheduling().Capacity;
        if (order.PickupAtTicks is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new IdempotencyResult(IdempotencyOutcome.Conflict);
        }
        await database.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "PickupSlotUsages" ("TenantId", "SlotStartTicks", "ReservedCount")
            VALUES ({order.TenantId}, {order.PickupAtTicks.Value}, 0)
            ON CONFLICT ("TenantId", "SlotStartTicks") DO NOTHING
            """, cancellationToken);
        var reserved = await database.PickupSlotUsages.Where(usage => usage.TenantId == order.TenantId &&
                usage.SlotStartTicks == order.PickupAtTicks.Value && usage.ReservedCount < capacity)
            .ExecuteUpdateAsync(update => update.SetProperty(usage => usage.ReservedCount,
                usage => usage.ReservedCount + 1), cancellationToken);
        if (reserved != 1)
        {
            await transaction.RollbackAsync(cancellationToken);
            return new IdempotencyResult(IdempotencyOutcome.Conflict);
        }

        database.Orders.Add(order);
        database.PickupSlotReservations.Add(PickupSlotReservation.Create(order.Id, order.TenantId,
            order.PickupAtTicks.Value));
        database.OrderIdempotencyRecords.Add(IdempotencyRecord.Create(order.TenantId, keyHash, requestHash,
            JsonSerializer.Serialize(receipt, ReceiptJson), now));
        AddOrderEvent(order, "order.created", now);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new IdempotencyResult(IdempotencyOutcome.New, receipt);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            database.ChangeTracker.Clear();
            var raced = await FindIdempotentOrderAsync(order.TenantId, keyHash, requestHash, now, cancellationToken);
            if (raced.Outcome != IdempotencyOutcome.New) return raced;
            throw;
        }
    }

    public async Task<OrderPageData> ListAsync(Guid tenantId, WhitePlate.Domain.Orders.OrderStatus? status,
        OrderPageCursor? cursor, int pageSize, CancellationToken cancellationToken)
    {
        var query = database.Orders.AsNoTracking().Where(order => order.TenantId == tenantId && order.ArchivedAt == null);
        if (status.HasValue) query = query.Where(order => order.Status == status.Value);
        if (cursor is not null)
            query = query.Where(order => order.CreatedAtTicks < cursor.CreatedAtTicks ||
                order.CreatedAtTicks == cursor.CreatedAtTicks && order.Id.CompareTo(cursor.Id) < 0);

        var rows = await query.OrderByDescending(order => order.CreatedAtTicks).ThenByDescending(order => order.Id)
            .Take(pageSize + 1).Select(order => new
            {
                Item = new OrderSummaryDto(order.Id, order.CustomerName, order.Currency, order.MenuLocale, order.Total,
                    order.Status.ToString(), order.Version, order.CreatedAt,
                    order.Lines.Select(line => new OrderSummaryLineDto(line.ProductId, line.ProductName,
                        line.Quantity, line.Options.Select(option => new OrderSummaryOptionDto(option.OptionId,
                            option.Name)).ToArray())
                    {
                        PreparationMinutes = line.PreparationMinutes,
                        PreparationNotes = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(
                            line.PreparationNotesJson) ?? new()
                    }).ToArray())
                    {
                        PickupAt = order.PickupAt,
                        PickupTimeZone = order.PickupTimeZone,
                        PickupMode = order.PickupMode.HasValue
                            ? order.PickupMode.Value.ToString()
                            : null
                    },
                order.CreatedAtTicks
            })
            .ToListAsync(cancellationToken);
        var hasMore = rows.Count > pageSize;
        if (hasMore) rows.RemoveAt(rows.Count - 1);
        var nextCursor = hasMore && rows.Count > 0
            ? new OrderPageCursor(rows[^1].CreatedAtTicks, rows[^1].Item.Id)
            : null;
        return new OrderPageData(rows.Select(row => row.Item).ToArray(), nextCursor);
    }

    public async Task<DashboardMetricsDto?> GetDashboardMetricsAsync(Guid tenantId, DateTimeOffset now,
        bool includeOrderValue, CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().Where(item => item.Id == tenantId && item.IsActive)
            .Select(item => new { item.Currency, item.TimeZone })
            .SingleOrDefaultAsync(cancellationToken);
        if (tenant is null) return null;

        var zone = TimeZoneInfo.FindSystemTimeZoneById(tenant.TimeZone);
        var businessDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, zone).DateTime);
        var comparisonDate = businessDate.AddDays(-1);
        var comparisonStart = LocalDayStartUtc(comparisonDate, zone);
        var businessStart = LocalDayStartUtc(businessDate, zone);
        var followingStart = LocalDayStartUtc(businessDate.AddDays(1), zone);
        var comparisonStartTicks = comparisonStart.UtcDateTime.Ticks;
        var businessStartTicks = businessStart.UtcDateTime.Ticks;
        var followingStartTicks = followingStart.UtcDateTime.Ticks;

        var ordersInRange = database.Orders.AsNoTracking().Where(order => order.TenantId == tenantId &&
            order.CreatedAtTicks >= comparisonStartTicks && order.CreatedAtTicks < followingStartTicks);
        var dailyTotals = await ordersInRange.GroupBy(order => order.CreatedAtTicks >= businessStartTicks)
            .Select(group => new
            {
                IsCurrentDay = group.Key,
                Count = group.Count(),
                OrderValue = group.Sum(order => order.Status == OrderStatus.Cancelled ? 0m : order.Total)
            }).ToListAsync(cancellationToken);

        var currentTotals = dailyTotals.SingleOrDefault(day => day.IsCurrentDay);
        var comparisonTotals = dailyTotals.SingleOrDefault(day => !day.IsCurrentDay);
        var activeCounts = await database.Orders.AsNoTracking()
            .Where(order => order.TenantId == tenantId &&
                (order.Status == OrderStatus.Pending || order.Status == OrderStatus.Preparing ||
                 order.Status == OrderStatus.Ready))
            .GroupBy(order => order.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .ToListAsync(cancellationToken);
        var pending = activeCounts.SingleOrDefault(item => item.Status == OrderStatus.Pending)?.Count ?? 0;
        var preparing = activeCounts.SingleOrDefault(item => item.Status == OrderStatus.Preparing)?.Count ?? 0;
        var ready = activeCounts.SingleOrDefault(item => item.Status == OrderStatus.Ready)?.Count ?? 0;

        var createdAtRows = await ordersInRange.Select(order => order.CreatedAt).ToListAsync(cancellationToken);
        var hourlyCounts = new int[2, 24];
        foreach (var createdAt in createdAtRows)
        {
            var localCreatedAt = TimeZoneInfo.ConvertTime(createdAt, zone);
            var localDate = DateOnly.FromDateTime(localCreatedAt.DateTime);
            var period = localDate == businessDate ? 0 : localDate == comparisonDate ? 1 : -1;
            if (period >= 0) hourlyCounts[period, localCreatedAt.Hour]++;
        }

        var hourlyOrders = Enumerable.Range(0, 24)
            .Select(hour => new HourlyOrderMetricsDto(hour, hourlyCounts[0, hour], hourlyCounts[1, hour]))
            .ToArray();

        var topSellingItemRows = await database.Orders.AsNoTracking()
            .Where(order => order.TenantId == tenantId && order.CreatedAtTicks >= businessStartTicks &&
                order.CreatedAtTicks < followingStartTicks && order.Status != OrderStatus.Cancelled)
            .SelectMany(order => order.Lines)
            .GroupBy(line => new { line.ProductId, line.ProductName })
            .Select(product => new
            {
                product.Key.ProductId,
                product.Key.ProductName,
                Quantity = product.Sum(line => line.Quantity)
            })
            .OrderByDescending(product => product.Quantity)
            .ThenBy(product => product.ProductName)
            .Take(5)
            .ToListAsync(cancellationToken);
        var topSellingItems = topSellingItemRows.Select(product =>
            new TopSellingItemMetricsDto(product.ProductId, product.ProductName, product.Quantity)).ToArray();

        var preparationRows = await database.Orders.AsNoTracking()
            .Where(order => order.TenantId == tenantId && order.ReadyAtTicks >= businessStartTicks &&
                order.ReadyAtTicks < followingStartTicks && order.PreparingAtTicks != null &&
                order.ReadyAtTicks >= order.PreparingAtTicks)
            .Select(order => new { order.PreparingAt, order.ReadyAt })
            .ToListAsync(cancellationToken);
        var preparationMinutes = preparationRows.Select(order =>
            (decimal)(order.ReadyAt!.Value - order.PreparingAt!.Value).TotalMinutes).ToArray();
        decimal? averagePreparationMinutes = preparationMinutes.Length == 0
            ? null
            : decimal.Round(preparationMinutes.Average(), 1, MidpointRounding.AwayFromZero);

        return new DashboardMetricsDto(tenant.Currency, tenant.TimeZone, businessDate, comparisonDate,
            currentTotals?.Count ?? 0, comparisonTotals?.Count ?? 0,
            includeOrderValue ? currentTotals?.OrderValue ?? 0m : null,
            includeOrderValue ? comparisonTotals?.OrderValue ?? 0m : null,
            new ActiveOrderMetricsDto(pending + preparing + ready, pending, preparing, ready),
            hourlyOrders, topSellingItems, averagePreparationMinutes, preparationMinutes.Length);
    }

    private static DateTimeOffset LocalDayStartUtc(DateOnly date, TimeZoneInfo zone)
    {
        var localStart = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        for (var minute = 0; zone.IsInvalidTime(localStart); minute++)
        {
            if (minute >= 24 * 60) throw new InvalidTimeZoneException("The time zone has no valid start for this local date.");
            localStart = localStart.AddMinutes(1);
        }

        var offset = zone.IsAmbiguousTime(localStart)
            ? zone.GetAmbiguousTimeOffsets(localStart).Max()
            : zone.GetUtcOffset(localStart);
        return new DateTimeOffset(localStart, offset).ToUniversalTime();
    }

    public async Task<OrderHistoryPageData> GetHistoryAsync(Guid tenantId, WhitePlate.Domain.Orders.OrderStatus? status,
        string? search, DateTimeOffset? createdAtFrom, DateTimeOffset? createdAtUntil, string sort,
        bool descending, int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = database.Orders.AsNoTracking().Where(order => order.TenantId == tenantId);
        if (status.HasValue) query = query.Where(order => order.Status == status.Value);
        if (createdAtFrom.HasValue) query = query.Where(order => order.CreatedAtTicks >= createdAtFrom.Value.UtcDateTime.Ticks);
        if (createdAtUntil.HasValue) query = query.Where(order => order.CreatedAtTicks < createdAtUntil.Value.UtcDateTime.Ticks);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            var normalizedTerm = term.ToUpperInvariant();
            query = Guid.TryParse(term, out var orderId)
                ? query.Where(order => order.Id == orderId)
                : query.Where(order => order.CustomerName.ToUpper().Contains(normalizedTerm) ||
                    order.Id.ToString().ToUpper().StartsWith(normalizedTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var ordered = sort switch
        {
            "total" when descending => query.OrderByDescending(order => order.Total).ThenByDescending(order => order.Id),
            "total" => query.OrderBy(order => order.Total).ThenBy(order => order.Id),
            _ when descending => query.OrderByDescending(order => order.CreatedAtTicks).ThenByDescending(order => order.Id),
            _ => query.OrderBy(order => order.CreatedAtTicks).ThenBy(order => order.Id)
        };
        var items = await ordered.Skip((page - 1) * pageSize).Take(pageSize).Select(order =>
            new OrderSummaryDto(order.Id, order.CustomerName, order.Currency, order.MenuLocale, order.Total,
                order.Status.ToString(), order.Version, order.CreatedAt,
                order.Lines.Select(line => new OrderSummaryLineDto(line.ProductId, line.ProductName,
                    line.Quantity, line.Options.Select(option => new OrderSummaryOptionDto(option.OptionId,
                        option.Name)).ToArray())
                {
                    PreparationMinutes = line.PreparationMinutes,
                    PreparationNotes = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(
                        line.PreparationNotesJson) ?? new()
                }).ToArray())
            {
                PickupAt = order.PickupAt,
                PickupTimeZone = order.PickupTimeZone,
                PickupMode = order.PickupMode.HasValue
                    ? order.PickupMode.Value.ToString()
                    : null
            }).ToListAsync(cancellationToken);
        return new OrderHistoryPageData(items, totalCount);
    }

    public async Task<PublicOrderTrackingDto?> GetPublicTrackingAsync(Guid tenantId, Guid orderId,
        string tokenHash, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var order = await database.Orders.AsNoTracking().Where(item => item.TenantId == tenantId &&
                item.Id == orderId && item.TrackingTokenHash != null)
            .Select(item => new
            {
                item.TrackingTokenHash, item.TrackingTokenExpiresAt, item.Id, item.Status, item.Version, item.CreatedAt, item.MenuLocale, item.PickupAt, item.PickupTimeZone
            }).SingleOrDefaultAsync(cancellationToken);
        if (order is null || order.TrackingTokenExpiresAt <= now || !CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(order.TrackingTokenHash!), Convert.FromHexString(tokenHash)))
            return null;

        return new PublicOrderTrackingDto(order.Id, order.Status.ToString(), order.Version, order.CreatedAt, order.MenuLocale)
            { PickupAt = order.PickupAt, PickupTimeZone = order.PickupTimeZone };
    }

    public Task<int> ArchiveClosedOrdersBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken)
    {
        var query = database.Orders.Where(order => order.ArchivedAt == null && order.ClosedAtTicks != null &&
            order.ClosedAtTicks < cutoff.UtcDateTime.Ticks &&
            (order.Status == WhitePlate.Domain.Orders.OrderStatus.Completed ||
             order.Status == WhitePlate.Domain.Orders.OrderStatus.Cancelled));
        return query.ExecuteUpdateAsync(update => update.SetProperty(order => order.ArchivedAt, cutoff),
            cancellationToken);
    }

    public async Task<Result<OrderReceiptDto>> TransitionAsync(Guid tenantId, Guid orderId,
        int expectedVersion, WhitePlate.Domain.Orders.OrderStatus status, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var order = await database.Orders.Include(item => item.Lines).ThenInclude(line => line.Options)
            .SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Id == orderId, cancellationToken);
        if (order is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        }
        if (order.Version != expectedVersion)
        {
            await transaction.RollbackAsync(cancellationToken);
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
        }

        try
        {
            var previousVersion = order.Version;
            if (status == WhitePlate.Domain.Orders.OrderStatus.Cancelled) order.Cancel(now);
            else order.TransitionTo(status, now);
            if (order.Version == previousVersion)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Result<OrderReceiptDto>.Success(order.ToReceipt());
            }
            if (status == WhitePlate.Domain.Orders.OrderStatus.Cancelled &&
                order.PickupAtTicks is { } pickupTicks && pickupTicks > now.UtcDateTime.Ticks)
            {
                var reservation = await database.PickupSlotReservations.SingleOrDefaultAsync(item =>
                    item.OrderId == order.Id && item.TenantId == tenantId, cancellationToken);
                if (reservation is not null && reservation.Release(now))
                {
                    var decremented = await database.PickupSlotUsages.Where(usage => usage.TenantId == tenantId &&
                            usage.SlotStartTicks == reservation.SlotStartTicks && usage.ReservedCount > 0)
                        .ExecuteUpdateAsync(update => update.SetProperty(usage => usage.ReservedCount,
                            usage => usage.ReservedCount - 1), cancellationToken);
                    if (decremented != 1)
                        throw new InvalidOperationException("The pickup slot reservation counter is inconsistent.");
                }
            }
            AddOrderEvent(order, status == WhitePlate.Domain.Orders.OrderStatus.Cancelled
                ? "order.cancelled"
                : "order.status_changed", now);
            var receipt = order.ToReceipt();
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Result<OrderReceiptDto>.Success(receipt);
        }
        catch (WhitePlate.Domain.Orders.InvalidOrderTransitionException)
        {
            await transaction.RollbackAsync(cancellationToken);
            database.ChangeTracker.Clear();
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.Conflict));
        }
        catch (DbUpdateConcurrencyException)
        {
            await transaction.RollbackAsync(cancellationToken);
            database.ChangeTracker.Clear();
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
        }
    }

    public Task<int> DeleteExpiredIdempotencyRecordsAsync(DateTimeOffset now,
        CancellationToken cancellationToken) => database.OrderIdempotencyRecords
        .Where(record => record.ExpiresAt <= now).ExecuteDeleteAsync(cancellationToken);

    private void AddOrderEvent(WhitePlate.Domain.Orders.Order order, string eventType, DateTimeOffset occurredAt)
    {
        var eventId = Guid.NewGuid();
        var orderEvent = new KitchenOrderEvent(eventId, order.TenantId, order.Id, eventType,
            order.Status.ToString(), order.Version, occurredAt);
        database.OrderOutboxMessages.Add(OutboxMessage.Create(eventId, order.TenantId, eventType,
            JsonSerializer.Serialize(orderEvent, ReceiptJson), occurredAt));
    }

    private static IdempotencyResult ResolveExisting(IdempotencyRecord? record, string requestHash, DateTimeOffset now)
    {
        if (record is null || record.IsExpired(now)) return new IdempotencyResult(IdempotencyOutcome.New);
        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(record.RequestHash),
                Convert.FromHexString(requestHash)))
            return new IdempotencyResult(IdempotencyOutcome.Conflict);
        var receipt = JsonSerializer.Deserialize<OrderReceiptDto>(record.ResponseJson, ReceiptJson)
                      ?? throw new InvalidOperationException("Stored order receipt is invalid.");
        return new IdempotencyResult(IdempotencyOutcome.Replayed, receipt);
    }

    private static PickupAvailabilityDto Availability(string state, Tenant tenant,
        IReadOnlyList<PickupSlot> slots, int rushBufferMinutes) => new(state, tenant.TimeZone, slots)
    {
        AcceptingOrders = tenant.AcceptingOrders,
        RushHoldEnabled = tenant.RushHoldEnabled,
        RushBufferMinutes = rushBufferMinutes
    };
}
