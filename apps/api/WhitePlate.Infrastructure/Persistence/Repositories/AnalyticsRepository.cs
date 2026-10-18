using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Orders;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class AnalyticsRepository(WhitePlateDbContext database) : IAnalyticsRepository
{
    public async Task<IReadOnlyList<Guid>> GetPriorConsentedOrderIdsAsync(Guid tenantId,
        IReadOnlyList<(string KeyVersion, string Hash)> fingerprints, DateTimeOffset before,
        DateTimeOffset after, CancellationToken cancellationToken)
    {
        if (fingerprints.Count == 0) return [];
        var versions = fingerprints.Select(item => item.KeyVersion).Distinct().ToArray();
        var hashes = fingerprints.Select(item => item.Hash).Distinct().ToArray();
        var pairs = fingerprints.ToHashSet();
        var candidates = await database.OrderAnalyticsFingerprints.AsNoTracking()
            .Where(fingerprint => fingerprint.TenantId == tenantId && versions.Contains(fingerprint.KeyVersion) &&
                hashes.Contains(fingerprint.FingerprintHash) && fingerprint.ExpiresAt > before)
            .Select(fingerprint => new { fingerprint.OrderId, fingerprint.KeyVersion, fingerprint.FingerprintHash })
            .ToListAsync(cancellationToken);
        var orderIds = candidates.Where(fingerprint => pairs.Contains((fingerprint.KeyVersion,
                fingerprint.FingerprintHash)))
            .Select(fingerprint => fingerprint.OrderId).Distinct().ToArray();
        if (orderIds.Length == 0) return [];
        return await database.Orders.AsNoTracking().Where(order => orderIds.Contains(order.Id) &&
                order.TenantId == tenantId && order.AnalyticsConsentedAt != null &&
                order.Status != OrderStatus.Cancelled && order.CreatedAt < before && order.CreatedAt >= after)
            .Select(order => order.Id).ToListAsync(cancellationToken);
    }

    public async Task WithdrawAsync(Guid tenantId,
        IReadOnlyList<(string KeyVersion, string Hash)> fingerprints, CancellationToken cancellationToken)
    {
        if (fingerprints.Count == 0) return;
        var versions = fingerprints.Select(item => item.KeyVersion).Distinct().ToArray();
        var hashes = fingerprints.Select(item => item.Hash).Distinct().ToArray();
        var pairs = fingerprints.ToHashSet();
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var possibleMatches = await database.OrderAnalyticsFingerprints.AsNoTracking().Where(fingerprint =>
                fingerprint.TenantId == tenantId && versions.Contains(fingerprint.KeyVersion) &&
                hashes.Contains(fingerprint.FingerprintHash))
            .Select(fingerprint => new { fingerprint.OrderId, fingerprint.KeyVersion, fingerprint.FingerprintHash })
            .ToListAsync(cancellationToken);
        var orderIds = possibleMatches.Where(fingerprint =>
                pairs.Contains((fingerprint.KeyVersion, fingerprint.FingerprintHash)))
            .Select(fingerprint => fingerprint.OrderId).Distinct().ToArray();
        if (orderIds.Length == 0)
        {
            await transaction.CommitAsync(cancellationToken);
            return;
        }
        await database.OrderAnalyticsFingerprints.Where(fingerprint => fingerprint.TenantId == tenantId &&
                orderIds.Contains(fingerprint.OrderId)).ExecuteDeleteAsync(cancellationToken);
        await database.OrderAnalyticsRepeatLinks.Where(link => link.TenantId == tenantId &&
                (orderIds.Contains(link.OrderId) || orderIds.Contains(link.PriorOrderId)))
            .ExecuteDeleteAsync(cancellationToken);
        await database.Orders.Where(order => order.TenantId == tenantId && orderIds.Contains(order.Id))
            .ExecuteUpdateAsync(update => update
                .SetProperty(order => order.AnalyticsConsentedAt, (DateTimeOffset?)null)
                .SetProperty(order => order.AnalyticsReturningCustomer, false), cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<int> CleanExpiredAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var expiredOrderIds = await database.OrderAnalyticsFingerprints.AsNoTracking()
            .Where(fingerprint => fingerprint.ExpiresAt <= now)
            .Select(fingerprint => fingerprint.OrderId).Distinct().ToArrayAsync(cancellationToken);
        var deleted = await database.OrderAnalyticsFingerprints
            .Where(fingerprint => fingerprint.ExpiresAt <= now).ExecuteDeleteAsync(cancellationToken);
        var deletedRepeatLinks = await database.OrderAnalyticsRepeatLinks
            .Where(link => link.ExpiresAt <= now).ExecuteDeleteAsync(cancellationToken);
        if (expiredOrderIds.Length > 0)
            await database.Orders.Where(order => expiredOrderIds.Contains(order.Id) &&
                    !database.OrderAnalyticsFingerprints.Any(fingerprint => fingerprint.OrderId == order.Id))
                .ExecuteUpdateAsync(update => update
                    .SetProperty(order => order.AnalyticsConsentedAt, (DateTimeOffset?)null)
                    .SetProperty(order => order.AnalyticsReturningCustomer, false), cancellationToken);
        return deleted + deletedRepeatLinks;
    }

    public async Task<AnalyticsMetricsDto?> GetMetricsAsync(Guid tenantId, int days, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().Where(item => item.Id == tenantId && item.IsActive)
            .Select(item => new { item.Id, item.Name, item.Currency, item.TimeZone })
            .SingleOrDefaultAsync(cancellationToken);
        if (tenant is null) return null;
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(tenant.TimeZone);
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, timeZone).DateTime);
        var currentStart = today.AddDays(1 - days);
        var comparisonStart = currentStart.AddDays(-days);
        var currentFrom = AtRestaurantMidnight(currentStart, timeZone);
        var endExclusive = AtRestaurantMidnight(today.AddDays(1), timeZone);
        var comparisonFrom = AtRestaurantMidnight(comparisonStart, timeZone);
        var orders = await database.Orders.AsNoTracking()
            .Include(order => order.Lines)
            .Include(order => order.AnalyticsFingerprints)
            .Include(order => order.AnalyticsRepeatLinks)
            .Where(order => order.TenantId == tenantId && order.CreatedAt >= comparisonFrom &&
                order.CreatedAt < endExclusive)
            .ToListAsync(cancellationToken);
        var current = orders.Where(order => order.CreatedAt >= currentFrom).ToArray();
        var previous = orders.Where(order => order.CreatedAt < currentFrom).ToArray();
        var currentSales = current.Where(IsRevenueOrder).ToArray();
        var previousSales = previous.Where(IsRevenueOrder).ToArray();
        var currencies = currentSales.Select(order => order.Currency)
            .Concat(previousSales.Select(order => order.Currency)).Append(tenant.Currency)
            .Distinct(StringComparer.Ordinal).Order(StringComparer.Ordinal).ToArray();
        var currentRevenue = RevenueByCurrency(currentSales);
        var previousRevenue = RevenueByCurrency(previousSales);
        var currentAverage = AverageByCurrency(currentSales);
        var previousAverage = AverageByCurrency(previousSales);
        var currentCurrencyOrders = currentSales.GroupBy(order => order.Currency)
            .ToDictionary(group => group.Key, group => group.Count(), StringComparer.Ordinal);
        var previousCurrencyOrders = previousSales.GroupBy(order => order.Currency)
            .ToDictionary(group => group.Key, group => group.Count(), StringComparer.Ordinal);
        var currentRepeat = RepeatCustomers(currentSales, now);
        var previousRepeat = RepeatCustomers(previousSales, now);
        var currentPrep = PreparationDurations(current);
        var previousPrep = PreparationDurations(previous);
        var count = current.Length;
        var previousCount = previous.Length;
        var series = Enumerable.Range(0, days).Select(index =>
        {
            var date = currentStart.AddDays(index);
            var priorDate = comparisonStart.AddDays(index);
            var daily = current.Where(order => LocalDate(order.CreatedAt, timeZone) == date).ToArray();
            var prior = previous.Where(order => LocalDate(order.CreatedAt, timeZone) == priorDate)
                .Where(IsRevenueOrder).ToArray();
            return new AnalyticsSeriesPoint(date.ToString("yyyy-MM-dd"), daily.Length,
                RevenueByCurrency(daily.Where(IsRevenueOrder)), RevenueByCurrency(prior));
        }).ToArray();
        var hourCounts = Enumerable.Range(11, 13).Select(hour => new AnalyticsHourCount(hour,
            current.Count(order => LocalDate(order.CreatedAt, timeZone) >= currentStart &&
                LocalDate(order.CreatedAt, timeZone) <= today &&
                TimeZoneInfo.ConvertTime(order.CreatedAt, timeZone).Hour == hour))).ToArray();
        var channels = new[] { "web", "qr", "unattributed" }.Select(channel => new AnalyticsChannelCount(
            channel, current.Count(order => channel switch
            {
                "web" => order.AnalyticsSource == "web",
                "qr" => order.AnalyticsSource == "qr",
                _ => order.AnalyticsSource is null
            }), channel == "unattributed" ? "untracked" : "available")).ToArray();
        var dishes = currentSales.SelectMany(order => order.Lines.Select(line => new
            {
                order.TenantId, tenant.Name, order.Currency, line.ProductName,
                line.Quantity, line.Total
            }))
            .GroupBy(line => new { line.TenantId, line.Name, line.Currency, line.ProductName })
            .Select(group => new AnalyticsDish(group.Key.TenantId, group.Key.Name, group.Key.ProductName,
                group.Sum(line => line.Quantity), group.Sum(line => line.Total), group.Key.Currency))
            .GroupBy(dish => dish.Currency, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .SelectMany(group => group.OrderByDescending(dish => dish.Revenue)
                .ThenByDescending(dish => dish.Quantity).Take(8))
            .ToArray();
        var scheduled = current.Where(order => order.Status == OrderStatus.Completed &&
            order.PickupMode == PickupMode.Scheduled && order.PickupAt.HasValue && order.ClosedAt.HasValue &&
            order.PickupAt.Value >= order.CreatedAt && order.ClosedAt.Value >= order.CreatedAt).ToArray();
        var previousScheduled = previous.Where(order => order.Status == OrderStatus.Completed &&
            order.PickupMode == PickupMode.Scheduled && order.PickupAt.HasValue && order.ClosedAt.HasValue &&
            order.PickupAt.Value >= order.CreatedAt && order.ClosedAt.Value >= order.CreatedAt).ToArray();
        var accepted = current.Where(order => order.PreparingAt.HasValue &&
            order.PreparingAt.Value >= order.CreatedAt).ToArray();
        var previousAccepted = previous.Where(order => order.PreparingAt.HasValue &&
            order.PreparingAt.Value >= order.CreatedAt).ToArray();
        var cancelled = current.Count(order => order.Status == OrderStatus.Cancelled);
        var onTimeCount = scheduled.Count(order => order.ClosedAt <= order.PickupAt);
        var acceptedFastCount = accepted.Count(order => order.PreparingAt!.Value - order.CreatedAt <= TimeSpan.FromMinutes(1));
        var previousOnTimeCount = previousScheduled.Count(order => order.ClosedAt <= order.PickupAt);
        var previousAcceptedFastCount = previousAccepted.Count(order =>
            order.PreparingAt!.Value - order.CreatedAt <= TimeSpan.FromMinutes(1));
        var discountUses = current.Count(order => order.DiscountCode is not null || order.DiscountAmount > 0);

        return new AnalyticsMetricsDto(1, tenant.Id, tenant.Name, tenant.Currency, tenant.TimeZone,
            new AnalyticsPeriod(currentStart.ToString("yyyy-MM-dd"), today.ToString("yyyy-MM-dd"), days),
            new AnalyticsPeriod(comparisonStart.ToString("yyyy-MM-dd"), currentStart.AddDays(-1).ToString("yyyy-MM-dd"), days),
            MoneyValues(currencies, currentRevenue, previousRevenue, currentCurrencyOrders,
                previousCurrencyOrders, unavailableWhenEmpty: false), count,
            previousCount > 0 ? previousCount : null, previousCount > 0,
            MoneyValues(currencies, currentAverage, previousAverage, currentCurrencyOrders,
                previousCurrencyOrders, unavailableWhenEmpty: true),
            Rate(currentRepeat.Rate, currentRepeat.Eligible, "percent", previousRepeat.Rate,
                previousRepeat.Eligible, "consented_email_fingerprint"),
            Rate(currentPrep.Count == 0 ? null : currentPrep.Average,
                currentPrep.Count, "minutes", previousPrep.Count == 0 ? null : previousPrep.Average,
                previousPrep.Count, "preparing_at_to_ready_at"),
            [new AnalyticsMoneyValue(tenant.Currency, 0m, "available", null, false, 0, 0)],
            series, hourCounts, channels, dishes,
            Rate(scheduled.Length == 0 ? null : (decimal)onTimeCount * 100m / scheduled.Length,
                scheduled.Length, "percent", previousScheduled.Length == 0 ? null :
                    (decimal)previousOnTimeCount * 100m / previousScheduled.Length,
                previousScheduled.Length, "completed_scheduled_pickups"),
            Rate(accepted.Length == 0 ? null : (decimal)acceptedFastCount * 100m / accepted.Length,
                accepted.Length, "percent", previousAccepted.Length == 0 ? null :
                    (decimal)previousAcceptedFastCount * 100m / previousAccepted.Length,
                previousAccepted.Length, "preparing_at_within_60_seconds"),
            Rate(count == 0 ? null : (decimal)cancelled * 100m / count, count, "percent",
                previousCount == 0 ? null : (decimal)previous.Count(order => order.Status == OrderStatus.Cancelled) * 100m / previousCount,
                previousCount, "cancelled_orders_over_created_orders"),
            Rate(currentPrep.Count == 0 ? null : currentPrep.Minimum, currentPrep.Count, "minutes",
                previousPrep.Count == 0 ? null : previousPrep.Minimum, previousPrep.Count, "preparing_at_to_ready_at"),
            Rate(currentPrep.Count == 0 ? null : currentPrep.Maximum, currentPrep.Count, "minutes",
                previousPrep.Count == 0 ? null : previousPrep.Maximum, previousPrep.Count, "preparing_at_to_ready_at"),
            discountUses,
            new AnalyticsNumberValue(null, "unavailable", "currency", 0, 0, null, false,
                "payment_refunds_not_implemented"));
    }

    private static bool IsRevenueOrder(Order order) => order.Status != OrderStatus.Cancelled;

    private static DateTimeOffset AtRestaurantMidnight(DateOnly date, TimeZoneInfo timeZone)
    {
        var local = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        return new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(local, timeZone), TimeSpan.Zero);
    }

    private static DateOnly LocalDate(DateTimeOffset value, TimeZoneInfo timeZone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(value, timeZone).DateTime);

    private static Dictionary<string, decimal> RevenueByCurrency(IEnumerable<Order> orders) => orders
        .GroupBy(order => order.Currency).ToDictionary(group => group.Key,
            group => group.Sum(order => order.Total), StringComparer.Ordinal);

    private static Dictionary<string, decimal> AverageByCurrency(IReadOnlyCollection<Order> orders) => orders
        .GroupBy(order => order.Currency).ToDictionary(group => group.Key,
            group => group.Sum(order => order.Total) / group.Count(), StringComparer.Ordinal);

    private static IReadOnlyList<AnalyticsMoneyValue> MoneyValues(IReadOnlyList<string> currencies,
        IReadOnlyDictionary<string, decimal> current, IReadOnlyDictionary<string, decimal> previous,
        IReadOnlyDictionary<string, int> currentCounts, IReadOnlyDictionary<string, int> previousCounts,
        bool unavailableWhenEmpty) => currencies.Select(currency =>
        {
            var hasCurrent = currentCounts.GetValueOrDefault(currency) > 0;
            var hasPrevious = previousCounts.GetValueOrDefault(currency) > 0;
            decimal? value = hasCurrent || !unavailableWhenEmpty ? current.GetValueOrDefault(currency) : null;
            decimal? previousValue = hasPrevious ? previous.GetValueOrDefault(currency) :
                unavailableWhenEmpty ? null : 0m;
            return new AnalyticsMoneyValue(currency, value, value.HasValue ? "available" : "unavailable",
                previousValue, value.HasValue && previousValue > 0,
                currentCounts.GetValueOrDefault(currency), previousCounts.GetValueOrDefault(currency));
        }).ToArray();

    private static (decimal? Rate, int Eligible) RepeatCustomers(IEnumerable<Order> orders, DateTimeOffset now)
    {
        var eligible = orders.Where(order => order.AnalyticsConsentedAt.HasValue &&
            order.AnalyticsFingerprints.Count > 0).ToArray();
        if (eligible.Length == 0) return (null, 0);

        var parents = Enumerable.Range(0, eligible.Length).ToArray();
        var indexesByOrderId = eligible.Select((order, index) => (order.Id, index))
            .ToDictionary(item => item.Id, item => item.index);
        int Find(int index)
        {
            if (parents[index] != index) parents[index] = Find(parents[index]);
            return parents[index];
        }
        void Union(int left, int right)
        {
            var leftRoot = Find(left);
            var rightRoot = Find(right);
            if (leftRoot != rightRoot) parents[rightRoot] = leftRoot;
        }

        for (var index = 0; index < eligible.Length; index++)
        {
            foreach (var link in eligible[index].AnalyticsRepeatLinks)
                if (link.ExpiresAt > now && indexesByOrderId.TryGetValue(link.PriorOrderId, out var priorIndex))
                    Union(index, priorIndex);
        }

        var customers = Enumerable.Range(0, eligible.Length).GroupBy(Find).Select(group =>
            group.Any(index => eligible[index].AnalyticsReturningCustomer)).ToArray();
        return ((decimal)customers.Count(isReturning => isReturning) * 100m / customers.Length, customers.Length);
    }

    private static (int Count, decimal? Average, decimal? Minimum, decimal? Maximum) PreparationDurations(
        IEnumerable<Order> orders)
    {
        var durations = orders.Where(order => order.Status != OrderStatus.Cancelled &&
                order.PreparingAt.HasValue && order.PreparingAt >= order.CreatedAt && order.ReadyAt.HasValue &&
                order.ReadyAt > order.PreparingAt)
            .Select(order => (decimal)(order.ReadyAt!.Value - order.PreparingAt!.Value).TotalMinutes).ToArray();
        return durations.Length == 0 ? (0, null, null, null) :
            (durations.Length, durations.Average(), durations.Min(), durations.Max());
    }

    private static AnalyticsNumberValue Rate(decimal? value, int samples, string unit,
        decimal? previous, int previousSamples, string provenance) => new(value,
        value.HasValue ? "available" : "unavailable", unit, samples, previousSamples, previous,
        value.HasValue && previous.HasValue && previous.Value > 0 && previousSamples > 0, provenance);
}
