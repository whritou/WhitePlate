using System.Data;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class CatalogPublicationRepository(WhitePlateDbContext database) : ICatalogPublicationRepository
{
    public async Task<PublishedCatalogSnapshot?> GetPublishedCatalogAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var head = await database.CatalogPublicationHeads.AsNoTracking()
            .SingleOrDefaultAsync(item => item.TenantId == tenantId, cancellationToken);
        return head is null ? null : DeserializeSnapshot(head.SnapshotJson);
    }

    public async Task<CatalogPublicationSummaryDto?> GetSummaryAsync(Guid tenantId,
        PublishedCatalogSnapshot draft, CancellationToken cancellationToken)
    {
        var head = await database.CatalogPublicationHeads.AsNoTracking()
            .SingleOrDefaultAsync(item => item.TenantId == tenantId, cancellationToken);
        if (head is null) return null;
        var published = DeserializeSnapshot(head.SnapshotJson);
        var currentDraft = CatalogPublicationRules.RemoveDraftOnlyTombstones(published, draft);
        var changes = CatalogPublicationRules.Compare(published, currentDraft);
        return new CatalogPublicationSummaryDto(head.PublishedVersion, head.UpdatedAt,
            changes.Count > 0, changes.Count, changes);
    }

    public async Task<CatalogHistoryDto?> GetHistoryAsync(Guid tenantId, int? beforeVersion, int pageSize,
        CancellationToken cancellationToken)
    {
        var head = await database.CatalogPublicationHeads.AsNoTracking()
            .SingleOrDefaultAsync(item => item.TenantId == tenantId, cancellationToken);
        if (head is null) return null;
        var query = database.CatalogRevisions.AsNoTracking().Where(item => item.TenantId == tenantId);
        if (beforeVersion is { } cursor) query = query.Where(item => item.Version < cursor);
        var revisions = await query.OrderByDescending(item => item.Version).Take(pageSize)
            .ToListAsync(cancellationToken);
        return new CatalogHistoryDto(head.PublishedVersion, revisions.Select(ToHistoryRevision).ToArray());
    }

    public async Task<Result<CatalogPublicationResultDto>> PublishAsync(Guid tenantId, int expectedVersion,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable,
            cancellationToken);
        var head = await GetHeadForUpdateAsync(tenantId, cancellationToken);
        if (head is null) return Failure<CatalogPublicationResultDto>(ErrorCode.NotFound);
        if (head.PublishedVersion != expectedVersion)
            return Failure<CatalogPublicationResultDto>(ErrorCode.PreconditionFailed);

        var current = DeserializeSnapshot(head.SnapshotJson);
        var draft = await ReadDraftSnapshotAsync(tenantId, cancellationToken);
        if (draft is null) return Failure<CatalogPublicationResultDto>(ErrorCode.NotFound);
        draft = CatalogPublicationRules.RemoveDraftOnlyTombstones(current, draft);
        var issues = CatalogPublicationRules.Validate(draft);
        if (issues.Count > 0)
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                issues.ToArray()));

        var changes = CatalogPublicationRules.Compare(current, draft);
        if (changes.Count == 0)
        {
            await transaction.CommitAsync(cancellationToken);
            return Result<CatalogPublicationResultDto>.Success(new(head.PublishedVersion, head.UpdatedAt));
        }

        return await AdvanceAsync(head, expectedVersion, draft, changes, "publish", null, identity,
            transaction, cancellationToken);
    }

    public async Task<Result<bool>> DiscardAsync(Guid tenantId, int expectedVersion,
        CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable,
            cancellationToken);
        var head = await GetHeadForUpdateAsync(tenantId, cancellationToken);
        if (head is null) return Failure<bool>(ErrorCode.NotFound);
        if (head.PublishedVersion != expectedVersion) return Failure<bool>(ErrorCode.PreconditionFailed);

        var published = DeserializeSnapshot(head.SnapshotJson);
        if (!await ApplySnapshotToDraftAsync(published, cancellationToken)) return Failure<bool>(ErrorCode.NotFound);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Result<bool>.Success(true);
        }
        catch (DbUpdateConcurrencyException)
        {
            return Failure<bool>(ErrorCode.PreconditionFailed);
        }
        catch (PostgresException exception) when (exception.SqlState == PostgresErrorCodes.SerializationFailure)
        {
            return Failure<bool>(ErrorCode.PreconditionFailed);
        }
    }

    public async Task<Result<CatalogPublicationResultDto>> RestoreAsync(Guid tenantId, int expectedVersion,
        int sourceVersion, ExternalIdentity identity, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable,
            cancellationToken);
        var head = await GetHeadForUpdateAsync(tenantId, cancellationToken);
        if (head is null) return Failure<CatalogPublicationResultDto>(ErrorCode.NotFound);
        if (head.PublishedVersion != expectedVersion)
            return Failure<CatalogPublicationResultDto>(ErrorCode.PreconditionFailed);

        var source = await database.CatalogRevisions.AsNoTracking().SingleOrDefaultAsync(item =>
            item.TenantId == tenantId && item.Version == sourceVersion, cancellationToken);
        if (source is null) return Failure<CatalogPublicationResultDto>(ErrorCode.NotFound);

        var current = DeserializeSnapshot(head.SnapshotJson);
        var restored = PreserveAvailability(DeserializeSnapshot(source.SnapshotJson), current);
        var issues = CatalogPublicationRules.Validate(restored);
        if (issues.Count > 0)
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                issues.ToArray()));
        if (!await ApplySnapshotToDraftAsync(restored, cancellationToken))
            return Failure<CatalogPublicationResultDto>(ErrorCode.Conflict);

        var changes = CatalogPublicationRules.Compare(current, restored);
        if (changes.Count == 0) return Failure<CatalogPublicationResultDto>(ErrorCode.Conflict);
        return await AdvanceAsync(head, expectedVersion, restored, changes, "rollback", sourceVersion,
            identity, transaction, cancellationToken);
    }

    public async Task<bool> SetProductAvailabilityAsync(Guid tenantId, Guid productId, bool isAvailable,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable,
            cancellationToken);
        var head = await GetHeadForUpdateAsync(tenantId, cancellationToken);
        if (head is null) return false;
        var current = DeserializeSnapshot(head.SnapshotJson);
        var product = current.Products.SingleOrDefault(item => item.Id == productId && !item.IsArchived);
        var category = product is null ? null : current.Categories.SingleOrDefault(item =>
            item.Id == product.CategoryId && !item.IsArchived && item.IsVisible);
        if (product is null || category is null) return false;
        var row = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId, cancellationToken);
        if (row is null) return false;
        if (product.IsAvailable == isAvailable)
        {
            row.SetAvailability(isAvailable);
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return true;
        }

        row.SetAvailability(isAvailable);
        var next = CatalogPublicationRules.WithAvailability(current, productId, isAvailable);
        var changes = CatalogPublicationRules.Compare(current, next);
        var result = await AdvanceAsync(head, head.PublishedVersion, next, changes, "availability", null,
            identity, transaction, cancellationToken);
        return result.IsSuccess;
    }

    private async Task<Result<CatalogPublicationResultDto>> AdvanceAsync(CatalogPublicationHead head,
        int expectedVersion, PublishedCatalogSnapshot snapshot, IReadOnlyList<CatalogChangeDto> changes,
        string action, int? sourceVersion, ExternalIdentity identity, Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var snapshotJson = JsonSerializer.Serialize(snapshot, CatalogPublicationJson.Options);
        if (!head.Advance(expectedVersion, snapshotJson, now))
            return Failure<CatalogPublicationResultDto>(ErrorCode.PreconditionFailed);
        database.CatalogRevisions.Add(CatalogRevision.Create(head.TenantId, head.PublishedVersion,
            snapshotJson, JsonSerializer.Serialize(changes, CatalogPublicationJson.Options), action,
            sourceVersion, identity.Issuer, identity.Subject, now));
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Result<CatalogPublicationResultDto>.Success(new(head.PublishedVersion, now));
        }
        catch (DbUpdateConcurrencyException)
        {
            return Failure<CatalogPublicationResultDto>(ErrorCode.PreconditionFailed);
        }
        catch (PostgresException exception) when (exception.SqlState is PostgresErrorCodes.SerializationFailure or PostgresErrorCodes.UniqueViolation)
        {
            return Failure<CatalogPublicationResultDto>(ErrorCode.PreconditionFailed);
        }
    }

    private async Task<CatalogPublicationHead?> GetHeadForUpdateAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var query = database.Database.IsNpgsql()
            ? database.CatalogPublicationHeads.FromSqlInterpolated(
                $"SELECT * FROM \"CatalogPublicationHeads\" WHERE \"TenantId\" = {tenantId} FOR UPDATE")
            : database.CatalogPublicationHeads;
        return await query.SingleOrDefaultAsync(item => item.TenantId == tenantId, cancellationToken);
    }

    private async Task<PublishedCatalogSnapshot?> ReadDraftSnapshotAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().SingleOrDefaultAsync(item => item.Id == tenantId,
            cancellationToken);
        if (tenant is null) return null;
        var categories = await database.MenuCategories.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var products = await database.Products.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var groups = await database.ProductOptionGroups.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var options = await database.ProductOptions.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var discounts = await database.PromotionDiscounts.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.Code).ThenBy(item => item.Id).ToListAsync(cancellationToken);

        return new PublishedCatalogSnapshot(tenant.Id, tenant.Currency, tenant.DefaultMenuLocale,
            tenant.GetMenuLocales(), categories.Select(ToAdmin).ToArray(), products.Select(ToAdmin).ToArray(),
            groups.Select(ToAdmin).ToArray(), options.Select(ToAdmin).ToArray(), discounts.Select(ToDto).ToArray());
    }

    private async Task<bool> ApplySnapshotToDraftAsync(PublishedCatalogSnapshot snapshot,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.SingleOrDefaultAsync(item => item.Id == snapshot.TenantId,
            cancellationToken);
        if (tenant is null) return false;
        tenant.UpdateMenuLocales(snapshot.Locales, snapshot.DefaultLocale);

        var categories = await database.MenuCategories.Where(item => item.TenantId == snapshot.TenantId)
            .ToDictionaryAsync(item => item.Id, cancellationToken);
        foreach (var category in snapshot.Categories)
        {
            if (!categories.TryGetValue(category.Id, out var row)) return false;
            row.Update(category.Name, category.SortOrder);
            row.SetVisibility(category.IsVisible);
            row.ReplaceTranslations(category.Translations);
            SetArchived(row.IsArchived, category.IsArchived, row.Archive, row.Restore);
        }
        foreach (var row in categories.Values.Where(row => snapshot.Categories.All(item => item.Id != row.Id)))
            if (!row.IsArchived) row.Archive();

        var products = await database.Products.Where(item => item.TenantId == snapshot.TenantId)
            .ToDictionaryAsync(item => item.Id, cancellationToken);
        foreach (var product in snapshot.Products)
        {
            if (!products.TryGetValue(product.Id, out var row)) return false;
            row.Update(product.Name, product.Description, product.BasePrice, product.TaxRatePercent,
                product.SortOrder, product.IsAvailable);
            row.ChangeCategory(product.CategoryId);
            row.SetMetadata(product.Sku, product.ContainsAllergens, product.MayContainAllergens,
                product.DietaryTags, product.PreparationMinutes, product.PreparationNotes);
            row.ReplaceTranslations(product.Translations);
            SetArchived(row.IsArchived, product.IsArchived, row.Archive, row.Restore);
        }
        foreach (var row in products.Values.Where(row => snapshot.Products.All(item => item.Id != row.Id)))
            if (!row.IsArchived) row.Archive();

        var groups = await database.ProductOptionGroups.Where(item => item.TenantId == snapshot.TenantId)
            .ToDictionaryAsync(item => item.Id, cancellationToken);
        foreach (var group in snapshot.OptionGroups)
        {
            if (!groups.TryGetValue(group.Id, out var row)) return false;
            row.Update(group.Name, group.MinimumSelections, group.MaximumSelections, group.SortOrder);
            row.ReplaceTranslations(group.Translations);
            SetArchived(row.IsArchived, group.IsArchived, row.Archive, row.Restore);
        }
        foreach (var row in groups.Values.Where(row => snapshot.OptionGroups.All(item => item.Id != row.Id)))
            if (!row.IsArchived) row.Archive();

        var options = await database.ProductOptions.Where(item => item.TenantId == snapshot.TenantId)
            .ToDictionaryAsync(item => item.Id, cancellationToken);
        foreach (var option in snapshot.Options)
        {
            if (!options.TryGetValue(option.Id, out var row)) return false;
            row.Update(option.Name, option.PriceAdjustment, option.SortOrder);
            row.ReplaceTranslations(option.Translations);
            SetArchived(row.IsArchived, option.IsArchived, row.Archive, row.Restore);
        }
        foreach (var row in options.Values.Where(row => snapshot.Options.All(item => item.Id != row.Id)))
            if (!row.IsArchived) row.Archive();

        var discounts = await database.PromotionDiscounts.Where(item => item.TenantId == snapshot.TenantId)
            .ToDictionaryAsync(item => item.Id, cancellationToken);
        foreach (var discount in snapshot.Discounts)
        {
            if (!discounts.TryGetValue(discount.Id, out var row)) return false;
            var kind = Enum.TryParse<DiscountKind>(discount.Kind, out var parsed) ? parsed : (DiscountKind)0;
            row.Update(discount.Name, kind, discount.Value, discount.MinimumOrderAmount, discount.ExpiresOn);
            if (discount.IsActive) row.Activate(); else row.Deactivate();
        }
        foreach (var row in discounts.Values.Where(row => snapshot.Discounts.All(item => item.Id != row.Id)))
            row.Deactivate();

        return true;
    }

    private static void SetArchived(bool current, bool target, Action archive, Action restore)
    {
        if (current == target) return;
        if (target) archive(); else restore();
    }

    private static PublishedCatalogSnapshot PreserveAvailability(PublishedCatalogSnapshot source,
        PublishedCatalogSnapshot current)
    {
        var availability = current.Products.ToDictionary(product => product.Id, product => product.IsAvailable);
        return source with
        {
            Products = source.Products.Select(product => availability.TryGetValue(product.Id, out var isAvailable)
                ? product with { IsAvailable = isAvailable }
                : product).ToArray()
        };
    }

    private static CatalogHistoryRevisionDto ToHistoryRevision(CatalogRevision revision) =>
        new(revision.Version, revision.PublishedAt, revision.Action, revision.SourceVersion,
            revision.ActorIssuer, revision.ActorSubject,
            JsonSerializer.Deserialize<CatalogChangeDto[]>(revision.ChangeSetJson, CatalogPublicationJson.Options) ?? []);

    private static PublishedCatalogSnapshot DeserializeSnapshot(string json) =>
        JsonSerializer.Deserialize<PublishedCatalogSnapshot>(json, CatalogPublicationJson.Options) ??
        throw new InvalidOperationException("The published catalog snapshot could not be read.");

    private static CatalogCategoryAdminDto ToAdmin(MenuCategory category) =>
        new(category.Id, category.Name, category.SortOrder, category.IsArchived)
        {
            IsVisible = category.IsVisible,
            Translations = CatalogTranslations.GetAll(category.TranslationsJson)
        };

    private static CatalogProductAdminDto ToAdmin(Product product) =>
        new(product.Id, product.CategoryId, product.Name, product.Description, product.BasePrice,
            product.TaxRatePercent, product.SortOrder, product.IsAvailable, product.IsArchived)
        {
            Sku = product.Sku,
            ContainsAllergens = product.ContainsAllergens,
            MayContainAllergens = product.MayContainAllergens,
            DietaryTags = product.DietaryTags,
            PreparationMinutes = product.PreparationMinutes,
            PreparationNotes = product.PreparationNotes,
            Translations = CatalogTranslations.GetAll(product.TranslationsJson)
        };

    private static CatalogOptionGroupAdminDto ToAdmin(ProductOptionGroup group) =>
        new(group.Id, group.ProductId, group.Name, group.MinimumSelections, group.MaximumSelections,
            group.SortOrder, group.IsArchived)
        {
            Translations = CatalogTranslations.GetAll(group.TranslationsJson)
        };

    private static CatalogOptionAdminDto ToAdmin(ProductOption option) =>
        new(option.Id, option.GroupId, option.Name, option.PriceAdjustment, option.SortOrder, option.IsArchived)
        {
            Translations = CatalogTranslations.GetAll(option.TranslationsJson)
        };

    private static PromotionDiscountDto ToDto(PromotionDiscount discount) => new(discount.Id, discount.Code,
        discount.Name, discount.Kind.ToString(), discount.Value, discount.IsActive,
        discount.MinimumOrderAmount, discount.ExpiresOn);

    private static Result<T> Failure<T>(ErrorCode code) => Result<T>.Failure(new ApplicationError(code));
}
