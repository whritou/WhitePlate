using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class CatalogRepository(WhitePlateDbContext database, ICatalogPublicationRepository publications) : ICatalogRepository
{
    public async Task<IReadOnlyList<ProductAvailabilityDto>> GetProductAvailabilityAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var snapshot = await publications.GetPublishedCatalogAsync(tenantId, cancellationToken);
        if (snapshot is not null)
        {
            var categories = snapshot.Categories.Where(category => !category.IsArchived && category.IsVisible)
                .Select(category => category.Id).ToHashSet();
            return snapshot.Products.Where(product => !product.IsArchived && categories.Contains(product.CategoryId))
                .OrderBy(product => product.SortOrder).ThenBy(product => product.Name)
                .Select(product => new ProductAvailabilityDto(product.Id, product.Name, product.IsAvailable)).ToArray();
        }

        return await database.Products.AsNoTracking().Where(product => product.TenantId == tenantId && !product.IsArchived &&
                database.MenuCategories.Any(category => category.TenantId == tenantId &&
                    category.Id == product.CategoryId && !category.IsArchived && category.IsVisible))
            .OrderBy(product => product.SortOrder).ThenBy(product => product.Name)
            .Select(product => new ProductAvailabilityDto(product.Id, product.Name, product.IsAvailable))
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> SetProductAvailabilityAsync(Guid tenantId, Guid productId, bool isAvailable,
        CancellationToken cancellationToken) =>
        await publications.SetProductAvailabilityAsync(tenantId, productId, isAvailable,
            ExternalIdentity.Create("https://system.whiteplate.invalid", "legacy-availability"), cancellationToken);

    public Task<bool> SetProductAvailabilityAsync(Guid tenantId, Guid productId, bool isAvailable,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        publications.SetProductAvailabilityAsync(tenantId, productId, isAvailable, identity, cancellationToken);

    public async Task<MenuLanguageSettingsDto?> GetMenuLanguageSettingsAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().SingleOrDefaultAsync(item => item.Id == tenantId,
            cancellationToken);
        return tenant is null ? null : new MenuLanguageSettingsDto(tenant.Id, tenant.GetMenuLocales(),
            tenant.DefaultMenuLocale);
    }

    public async Task<MenuLanguageSettingsDto?> UpdateMenuLanguageSettingsAsync(Guid tenantId,
        IReadOnlyList<string> locales, string defaultLocale, CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);
        if (tenant is null) return null;
        var previousDefault = tenant.DefaultMenuLocale;
        tenant.UpdateMenuLocales(locales, defaultLocale);
        if (!string.Equals(previousDefault, tenant.DefaultMenuLocale, StringComparison.OrdinalIgnoreCase))
            await EnsureDefaultTranslationsAsync(tenantId, tenant.DefaultMenuLocale, cancellationToken);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuLanguageSettingsDto(tenant.Id, tenant.GetMenuLocales(), tenant.DefaultMenuLocale);
    }

    public async Task<bool> SetTranslationAsync(Guid tenantId, string entityType, Guid entityId, string locale,
        string name, string? description, CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().SingleOrDefaultAsync(item => item.Id == tenantId,
            cancellationToken);
        if (tenant is null) return false;
        if (!tenant.SupportsMenuLocale(locale))
            throw new DomainRuleException("unsupported_menu_locale", "locale",
                "Enable this language in the restaurant menu settings before adding its translation.");

        var updated = entityType switch
        {
            "categories" => await SetCategoryTranslationAsync(tenantId, entityId, locale, name, cancellationToken),
            "products" => await SetProductTranslationAsync(tenantId, entityId, locale, name, description, cancellationToken),
            "option-groups" => await SetOptionGroupTranslationAsync(tenantId, entityId, locale, name, cancellationToken),
            "options" => await SetOptionTranslationAsync(tenantId, entityId, locale, name, cancellationToken),
            _ => throw new DomainRuleException("invalid_catalog_type", "entityType", "The catalog item type is invalid.")
        };
        if (updated) await database.SaveChangesAsync(cancellationToken);
        return updated;
    }

    public async Task<RestaurantDescriptionTranslationsDto?> GetRestaurantDescriptionTranslationsAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.AsNoTracking().SingleOrDefaultAsync(item => item.Id == tenantId,
            cancellationToken);
        return tenant is null
            ? null
            : new RestaurantDescriptionTranslationsDto(tenant.Id, tenant.GetMenuLocales(),
                tenant.DefaultMenuLocale, tenant.GetDescriptionTranslations());
    }

    public async Task<bool> SetRestaurantDescriptionTranslationAsync(Guid tenantId, string locale,
        string? description, CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);
        if (tenant is null) return false;
        tenant.SetDescriptionTranslation(locale, description);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<CatalogManagementDto?> GetManagementCatalogAsync(Guid tenantId, CancellationToken cancellationToken)
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
        var draft = new CatalogManagementDto(tenantId, tenant.Currency,
            categories.Select(item => new CatalogCategoryAdminDto(item.Id, item.Name, item.SortOrder, item.IsArchived)
                { IsVisible = item.IsVisible, Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            products.Select(item => new CatalogProductAdminDto(item.Id, item.CategoryId, item.Name, item.Description,
                item.BasePrice, item.TaxRatePercent, item.SortOrder, item.IsAvailable, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson), Sku = item.Sku,
                    ContainsAllergens = item.ContainsAllergens, MayContainAllergens = item.MayContainAllergens,
                    DietaryTags = item.DietaryTags, PreparationMinutes = item.PreparationMinutes,
                    PreparationNotes = item.PreparationNotes }).ToArray(),
            groups.Select(item => new CatalogOptionGroupAdminDto(item.Id, item.ProductId, item.Name,
                item.MinimumSelections, item.MaximumSelections, item.SortOrder, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            options.Select(item => new CatalogOptionAdminDto(item.Id, item.GroupId, item.Name,
                item.PriceAdjustment, item.SortOrder, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            discounts.Select(ToDto).ToArray());
        var snapshot = ToPublishedSnapshot(draft, tenant.GetMenuLocales(), tenant.DefaultMenuLocale);
        var publication = await publications.GetSummaryAsync(tenantId, snapshot, cancellationToken);
        return publication is null ? draft : draft with { Publication = publication };
    }

    public Task<bool> ProductBelongsToTenantAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken) =>
        database.Products.AsNoTracking().AnyAsync(product => product.TenantId == tenantId && product.Id == productId && !product.IsArchived, cancellationToken);

    public Task<bool> OptionGroupBelongsToTenantAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken) =>
        database.ProductOptionGroups.AsNoTracking().AnyAsync(group => group.TenantId == tenantId && group.Id == groupId && !group.IsArchived, cancellationToken);

    public async Task<MenuOptionGroupDto> AddOptionGroupAsync(WhitePlate.Domain.Catalog.ProductOptionGroup group, CancellationToken cancellationToken)
    {
        database.ProductOptionGroups.Add(group);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionGroupDto(group.Id, group.Name, group.MinimumSelections, group.MaximumSelections, group.SortOrder, []);
    }

    public async Task<MenuOptionDto> AddOptionAsync(WhitePlate.Domain.Catalog.ProductOption option, CancellationToken cancellationToken)
    {
        database.ProductOptions.Add(option);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionDto(option.Id, option.Name, option.PriceAdjustment, option.SortOrder);
    }

    public async Task<bool> AddDiscountAsync(WhitePlate.Domain.Catalog.PromotionDiscount discount, CancellationToken cancellationToken)
    {
        if (await database.PromotionDiscounts.AnyAsync(item => item.TenantId == discount.TenantId && item.Code == discount.Code, cancellationToken))
            return false;
        database.PromotionDiscounts.Add(discount);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SetCategoryVisibilityAsync(Guid tenantId, Guid categoryId, bool isVisible,
        CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == categoryId && !item.IsArchived, cancellationToken);
        if (category is null) return false;
        category.SetVisibility(isVisible);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<MenuCategoryDto?> UpdateCategoryAsync(Guid tenantId, Guid categoryId, string name,
        int sortOrder, CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == categoryId && !item.IsArchived, cancellationToken);
        if (category is null) return null;
        category.Update(name, sortOrder);
        category.SetTranslation(await GetDefaultLocaleAsync(tenantId, cancellationToken), name);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []);
    }

    public async Task<MenuProductDto?> UpdateProductAsync(Guid tenantId, Guid productId, string name,
        string? description, decimal basePrice, decimal taxRatePercent, int sortOrder, bool isAvailable,
        CancellationToken cancellationToken, Guid? categoryId = null, string? sku = null,
        IReadOnlyList<string>? containsAllergens = null, IReadOnlyList<string>? mayContainAllergens = null,
        IReadOnlyList<string>? dietaryTags = null, int? preparationMinutes = null,
        IReadOnlyDictionary<string, string>? preparationNotes = null)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId && !item.IsArchived, cancellationToken);
        if (product is null) return null;
        if (!await database.MenuCategories.AsNoTracking().AnyAsync(item => item.TenantId == tenantId &&
            item.Id == product.CategoryId && !item.IsArchived, cancellationToken)) return null;
        var targetCategoryId = categoryId ?? product.CategoryId;
        if (!await database.MenuCategories.AsNoTracking().AnyAsync(item => item.TenantId == tenantId &&
            item.Id == targetCategoryId && !item.IsArchived, cancellationToken)) return null;
        var normalizedSku = string.IsNullOrWhiteSpace(sku) ? null : sku.Trim().ToUpperInvariant();
        if (normalizedSku is not null && await database.Products.AsNoTracking().AnyAsync(item =>
                item.TenantId == tenantId && item.Id != productId && item.Sku == normalizedSku, cancellationToken))
            throw new DomainRuleException("duplicate_sku", "sku", "SKU is already used by this restaurant.");
        product.Update(name, description, basePrice, taxRatePercent, sortOrder, isAvailable);
        product.SetMetadata(sku, containsAllergens, mayContainAllergens, dietaryTags, preparationMinutes, preparationNotes);
        product.ChangeCategory(targetCategoryId);
        product.SetTranslation(await GetDefaultLocaleAsync(tenantId, cancellationToken), name, description);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException) when (normalizedSku is not null)
        {
            if (await database.Products.AsNoTracking().AnyAsync(item => item.TenantId == tenantId &&
                    item.Id != productId && item.Sku == normalizedSku, cancellationToken))
                throw new DomainRuleException("duplicate_sku", "sku", "SKU is already used by this restaurant.");
            throw;
        }
        return ToMenuProductDto(product);
    }

    public async Task<MenuOptionGroupDto?> UpdateOptionGroupAsync(Guid tenantId, Guid groupId, string name,
        int minimumSelections, int maximumSelections, int sortOrder, CancellationToken cancellationToken)
    {
        var group = await database.ProductOptionGroups.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == groupId && !item.IsArchived, cancellationToken);
        if (group is null) return null;
        group.Update(name, minimumSelections, maximumSelections, sortOrder);
        group.SetTranslation(await GetDefaultLocaleAsync(tenantId, cancellationToken), name);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionGroupDto(group.Id, group.Name, group.MinimumSelections, group.MaximumSelections,
            group.SortOrder, []);
    }

    public async Task<MenuOptionDto?> UpdateOptionAsync(Guid tenantId, Guid optionId, string name,
        decimal priceAdjustment, int sortOrder, CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == optionId && !item.IsArchived, cancellationToken);
        if (option is null) return null;
        option.Update(name, priceAdjustment, sortOrder);
        option.SetTranslation(await GetDefaultLocaleAsync(tenantId, cancellationToken), name);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionDto(option.Id, option.Name, option.PriceAdjustment, option.SortOrder);
    }

    public async Task<PromotionDiscountDto?> UpdateDiscountAsync(Guid tenantId, Guid discountId, string name,
        WhitePlate.Domain.Catalog.DiscountKind kind, decimal value, decimal minimumOrderAmount,
        DateOnly? expiresOn, CancellationToken cancellationToken)
    {
        var discount = await database.PromotionDiscounts.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == discountId && item.IsActive, cancellationToken);
        if (discount is null) return null;
        discount.Update(name, kind, value, minimumOrderAmount, expiresOn);
        await database.SaveChangesAsync(cancellationToken);
        return ToDto(discount);
    }

    public async Task<bool> ArchiveCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == categoryId && !item.IsArchived, cancellationToken);
        if (category is null) return false;
        var products = await database.Products.Where(item => item.TenantId == tenantId &&
            item.CategoryId == categoryId && !item.IsArchived).ToListAsync(cancellationToken);
        var groups = await database.ProductOptionGroups.Where(item => item.TenantId == tenantId &&
            products.Select(product => product.Id).Contains(item.ProductId) && !item.IsArchived).ToListAsync(cancellationToken);
        var options = await database.ProductOptions.Where(item => item.TenantId == tenantId &&
            groups.Select(group => group.Id).Contains(item.GroupId) && !item.IsArchived).ToListAsync(cancellationToken);
        foreach (var option in options) option.Archive();
        foreach (var group in groups) group.Archive();
        foreach (var product in products) product.Archive();
        category.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ArchiveProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId && !item.IsArchived, cancellationToken);
        if (product is null) return false;
        await ArchiveOptionGroupsAsync(tenantId, [productId], cancellationToken);
        product.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId && item.IsArchived && database.MenuCategories.Any(category =>
                category.Id == item.CategoryId && category.TenantId == item.TenantId && !category.IsArchived), cancellationToken);
        if (product is null) return false;
        product.Restore();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == categoryId && item.IsArchived, cancellationToken);
        if (category is null) return false;
        category.Restore();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ArchiveOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken)
    {
        var group = await database.ProductOptionGroups.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == groupId && !item.IsArchived, cancellationToken);
        if (group is null) return false;
        await ArchiveOptionsAsync(tenantId, [groupId], cancellationToken);
        group.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken)
    {
        var group = await database.ProductOptionGroups.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == groupId && item.IsArchived && database.Products.Any(product =>
                product.TenantId == tenantId && product.Id == item.ProductId && !product.IsArchived &&
                database.MenuCategories.Any(category => category.TenantId == tenantId &&
                    category.Id == product.CategoryId && !category.IsArchived)), cancellationToken);
        if (group is null) return false;
        group.Restore();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ArchiveOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == optionId && !item.IsArchived, cancellationToken);
        if (option is null) return false;
        option.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> RestoreOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == optionId && item.IsArchived && database.ProductOptionGroups.Any(group =>
                group.TenantId == tenantId && group.Id == item.GroupId && !group.IsArchived &&
                database.Products.Any(product => product.TenantId == tenantId && product.Id == group.ProductId &&
                    !product.IsArchived && database.MenuCategories.Any(category => category.TenantId == tenantId &&
                        category.Id == product.CategoryId && !category.IsArchived))), cancellationToken);
        if (option is null) return false;
        option.Restore();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ReorderCatalogAsync(Guid tenantId, string entityType, Guid? parentId,
        Guid? categoryId, IReadOnlyList<Guid> orderedIds, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        switch (entityType)
        {
            case "categories":
            {
                var items = await database.MenuCategories.Where(item => item.TenantId == tenantId && !item.IsArchived)
                    .ToListAsync(cancellationToken);
                if (!HasSameIds(items.Select(item => item.Id), orderedIds)) return false;
                for (var index = 0; index < orderedIds.Count; index++)
                    items.Single(item => item.Id == orderedIds[index]).SetSortOrder(index);
                break;
            }
            case "products":
            {
                var targetCategoryId = categoryId!.Value;
                if (!await database.MenuCategories.AnyAsync(item => item.TenantId == tenantId &&
                        item.Id == targetCategoryId && !item.IsArchived, cancellationToken)) return false;
                var targetItems = await database.Products.Where(item => item.TenantId == tenantId &&
                    item.CategoryId == targetCategoryId && !item.IsArchived).ToListAsync(cancellationToken);
                var requestedItems = await database.Products.Where(item => item.TenantId == tenantId &&
                    orderedIds.Contains(item.Id) && !item.IsArchived && database.MenuCategories.Any(category =>
                        category.TenantId == tenantId && category.Id == item.CategoryId && !category.IsArchived))
                    .ToListAsync(cancellationToken);
                if (!targetItems.All(item => orderedIds.Contains(item.Id)) || requestedItems.Count != orderedIds.Count)
                    return false;
                var moved = requestedItems.Where(item => item.CategoryId != targetCategoryId).ToArray();
                var sourceCategoryIds = moved.Select(item => item.CategoryId).Distinct().ToArray();
                foreach (var (item, index) in orderedIds.Select((id, index) =>
                             (requestedItems.Single(item => item.Id == id), index)))
                {
                    item.ChangeCategory(targetCategoryId);
                    item.SetSortOrder(index);
                }
                var movedIds = moved.Select(item => item.Id).ToArray();
                foreach (var sourceCategoryId in sourceCategoryIds)
                {
                    var sourceItems = await database.Products.Where(item => item.TenantId == tenantId &&
                            item.CategoryId == sourceCategoryId && !item.IsArchived && !movedIds.Contains(item.Id))
                        .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
                    for (var index = 0; index < sourceItems.Count; index++) sourceItems[index].SetSortOrder(index);
                }
                break;
            }
            case "option-groups":
            {
                var productId = parentId!.Value;
                if (!await database.Products.AnyAsync(item => item.TenantId == tenantId && item.Id == productId &&
                        !item.IsArchived && database.MenuCategories.Any(category => category.TenantId == tenantId &&
                            category.Id == item.CategoryId && !category.IsArchived), cancellationToken)) return false;
                var items = await database.ProductOptionGroups.Where(item => item.TenantId == tenantId &&
                    item.ProductId == productId && !item.IsArchived).ToListAsync(cancellationToken);
                if (!HasSameIds(items.Select(item => item.Id), orderedIds)) return false;
                for (var index = 0; index < orderedIds.Count; index++)
                    items.Single(item => item.Id == orderedIds[index]).SetSortOrder(index);
                break;
            }
            case "options":
            {
                var groupId = parentId!.Value;
                if (!await database.ProductOptionGroups.AnyAsync(group => group.TenantId == tenantId &&
                        group.Id == groupId && !group.IsArchived && database.Products.Any(product =>
                            product.TenantId == tenantId && product.Id == group.ProductId && !product.IsArchived &&
                            database.MenuCategories.Any(category => category.TenantId == tenantId &&
                                category.Id == product.CategoryId && !category.IsArchived)), cancellationToken)) return false;
                var items = await database.ProductOptions.Where(item => item.TenantId == tenantId &&
                    item.GroupId == groupId && !item.IsArchived).ToListAsync(cancellationToken);
                if (!HasSameIds(items.Select(item => item.Id), orderedIds)) return false;
                for (var index = 0; index < orderedIds.Count; index++)
                    items.Single(item => item.Id == orderedIds[index]).SetSortOrder(index);
                break;
            }
            default:
                return false;
        }
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    private static bool HasSameIds(IEnumerable<Guid> existing, IReadOnlyCollection<Guid> requested)
    {
        var ids = existing.ToArray();
        return ids.Length == requested.Count && ids.All(requested.Contains);
    }

    public async Task<bool> DeactivateDiscountAsync(Guid tenantId, Guid discountId,
        CancellationToken cancellationToken)
    {
        var discount = await database.PromotionDiscounts.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == discountId && item.IsActive, cancellationToken);
        if (discount is null) return false;
        discount.Deactivate();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ArchiveOptionGroupsAsync(Guid tenantId, Guid[] productIds, CancellationToken cancellationToken)
    {
        var groups = await database.ProductOptionGroups.Where(item => item.TenantId == tenantId &&
            productIds.Contains(item.ProductId) && !item.IsArchived).ToListAsync(cancellationToken);
        await ArchiveOptionsAsync(tenantId, groups.Select(group => group.Id).ToArray(), cancellationToken);
        foreach (var group in groups) group.Archive();
    }

    private async Task ArchiveOptionsAsync(Guid tenantId, Guid[] groupIds, CancellationToken cancellationToken)
    {
        var options = await database.ProductOptions.Where(item => item.TenantId == tenantId &&
            groupIds.Contains(item.GroupId) && !item.IsArchived).ToListAsync(cancellationToken);
        foreach (var option in options) option.Archive();
    }

    public Task<bool> CategoryBelongsToTenantAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken) =>
        database.MenuCategories.AsNoTracking().AnyAsync(category => category.TenantId == tenantId &&
            category.Id == categoryId && !category.IsArchived, cancellationToken);

    public async Task<MenuCategoryDto> AddCategoryAsync(WhitePlate.Domain.Catalog.MenuCategory category,
        CancellationToken cancellationToken)
    {
        database.MenuCategories.Add(category);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []);
    }

    public async Task<bool> AddProductAsync(WhitePlate.Domain.Catalog.Product product,
        CancellationToken cancellationToken)
    {
        if (product.Sku is not null && await database.Products.AsNoTracking().AnyAsync(item =>
                item.TenantId == product.TenantId && item.Sku == product.Sku, cancellationToken)) return false;
        database.Products.Add(product);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException) when (product.Sku is not null)
        {
            database.Entry(product).State = EntityState.Detached;
            if (await database.Products.AsNoTracking().AnyAsync(item => item.TenantId == product.TenantId &&
                    item.Sku == product.Sku, cancellationToken)) return false;
            throw;
        }
        return true;
    }

    public Task<MenuDto> GetMenuAsync(TenantDto tenant, CancellationToken cancellationToken) =>
        GetMenuAsync(tenant, null, cancellationToken);

    public async Task<MenuDto> GetMenuAsync(TenantDto tenant, string? requestedLocale,
        CancellationToken cancellationToken)
    {
        var restaurant = await database.Tenants.AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == tenant.Id, cancellationToken);
        var published = await publications.GetPublishedCatalogAsync(tenant.Id, cancellationToken);
        if (restaurant is not null && published is not null)
            return await MapPublishedMenuAsync(tenant, restaurant, published, requestedLocale, cancellationToken);

        var locale = MenuLocale.TryCreate(requestedLocale, out var normalizedLocale) &&
                     tenant.MenuLocales.Contains(normalizedLocale!.Value, StringComparer.OrdinalIgnoreCase)
            ? normalizedLocale.Value
            : tenant.DefaultMenuLocale;
        var categories = await database.MenuCategories.AsNoTracking()
            .Where(category => category.TenantId == tenant.Id && !category.IsArchived && category.IsVisible)
            .OrderBy(category => category.SortOrder).ThenBy(category => category.Id)
            .Select(category => new { category.Id, category.Name, category.TranslationsJson, category.SortOrder })
            .ToListAsync(cancellationToken);
        var categoryIds = categories.Select(category => category.Id).ToArray();
        var products = await database.Products.AsNoTracking()
            .Where(product => product.TenantId == tenant.Id && categoryIds.Contains(product.CategoryId) &&
                !product.IsArchived)
            .OrderBy(product => product.SortOrder).ThenBy(product => product.Id)
            .Select(product => new { product.Id, product.CategoryId, product.Name, product.Description,
                product.TranslationsJson, product.BasePrice, product.TaxRatePercent, product.SortOrder,
                product.IsAvailable, product.Sku, product.ContainsAllergensJson, product.MayContainAllergensJson,
                product.DietaryTagsJson, product.PreparationMinutes, product.PreparationNotesJson })
            .ToListAsync(cancellationToken);
        var productIds = products.Select(product => product.Id).ToArray();
        var photos = await database.MediaAssets.AsNoTracking().Where(asset => asset.TenantId == tenant.Id &&
            asset.ProductId != null && productIds.Contains(asset.ProductId.Value) && asset.IsActive && asset.IsReady)
            .OrderBy(asset => asset.SortOrder).ThenBy(asset => asset.Id).ToListAsync(cancellationToken);
        var groups = await database.ProductOptionGroups.AsNoTracking()
            .Where(group => group.TenantId == tenant.Id && productIds.Contains(group.ProductId) && !group.IsArchived)
            .OrderBy(group => group.SortOrder).ThenBy(group => group.Id)
            .Select(group => new { group.Id, group.ProductId, group.Name, group.TranslationsJson, group.MinimumSelections,
                group.MaximumSelections, group.SortOrder })
            .ToListAsync(cancellationToken);
        var groupIds = groups.Select(group => group.Id).ToArray();
        var options = await database.ProductOptions.AsNoTracking()
            .Where(option => option.TenantId == tenant.Id && groupIds.Contains(option.GroupId) && !option.IsArchived)
            .OrderBy(option => option.SortOrder).ThenBy(option => option.Id)
            .Select(option => new { option.Id, option.GroupId, option.Name, option.TranslationsJson,
                option.PriceAdjustment, option.SortOrder })
            .ToListAsync(cancellationToken);

        var groupsByProduct = groups.GroupBy(group => group.ProductId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<MenuOptionGroupDto>)group.Select(item => new MenuOptionGroupDto(item.Id,
                CatalogTranslations.Get(item.TranslationsJson, locale, tenant.DefaultMenuLocale, item.Name).Name,
                item.MinimumSelections, item.MaximumSelections, item.SortOrder,
                options.Where(option => option.GroupId == item.Id).Select(option => new MenuOptionDto(option.Id,
                    CatalogTranslations.Get(option.TranslationsJson, locale, tenant.DefaultMenuLocale, option.Name).Name,
                    option.PriceAdjustment, option.SortOrder)).ToArray())).ToArray());
        var productsByCategory = products.GroupBy(product => product.CategoryId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<MenuProductDto>)group.Select(item => new MenuProductDto(item.Id,
                CatalogTranslations.Get(item.TranslationsJson, locale, tenant.DefaultMenuLocale, item.Name,
                    item.Description).Name,
                CatalogTranslations.Get(item.TranslationsJson, locale, tenant.DefaultMenuLocale, item.Name,
                    item.Description).Description,
                item.BasePrice, item.TaxRatePercent, item.SortOrder,
                groupsByProduct.GetValueOrDefault(item.Id, [])) { IsAvailable = item.IsAvailable,
                    ContainsAllergens = System.Text.Json.JsonSerializer.Deserialize<string[]>(item.ContainsAllergensJson) ?? [],
                    MayContainAllergens = System.Text.Json.JsonSerializer.Deserialize<string[]>(item.MayContainAllergensJson) ?? [],
                    DietaryTags = System.Text.Json.JsonSerializer.Deserialize<string[]>(item.DietaryTagsJson) ?? [],
                    PreparationMinutes = item.PreparationMinutes,
                    PreparationNotes = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(item.PreparationNotesJson) ?? new(),
                    Photos = photos.Where(asset => asset.ProductId == item.Id).Select(asset =>
                        new WhitePlate.Application.Media.ProductPhotoDto(asset.Id, asset.Width, asset.Height, asset.Bytes)).ToArray() }).ToArray());
        return new MenuDto(tenant.Id, tenant.Name, tenant.Currency, locale, tenant.DefaultMenuLocale,
            tenant.MenuLocales, categories.Select(category =>
            new MenuCategoryDto(category.Id,
                CatalogTranslations.Get(category.TranslationsJson, locale, tenant.DefaultMenuLocale, category.Name).Name,
                category.SortOrder,
                productsByCategory.GetValueOrDefault(category.Id, []))).ToArray())
        {
            RestaurantDescription = restaurant?.ResolveDescription(locale),
            Establishment = restaurant is null ? null : PublicEstablishmentDto.FromTenant(restaurant, locale)
        };
    }

    private async Task<string> GetDefaultLocaleAsync(Guid tenantId, CancellationToken cancellationToken) =>
        await database.Tenants.AsNoTracking().Where(tenant => tenant.Id == tenantId)
            .Select(tenant => tenant.DefaultMenuLocale).SingleAsync(cancellationToken);

    private async Task EnsureDefaultTranslationsAsync(Guid tenantId, string locale,
        CancellationToken cancellationToken)
    {
        var categoryTranslations = await database.MenuCategories.AsNoTracking()
            .Where(item => item.TenantId == tenantId && !item.IsArchived)
            .Select(item => item.TranslationsJson).ToListAsync(cancellationToken);
        var productTranslations = await database.Products.AsNoTracking()
            .Where(item => item.TenantId == tenantId && !item.IsArchived)
            .Select(item => item.TranslationsJson).ToListAsync(cancellationToken);
        var groupTranslations = await database.ProductOptionGroups.AsNoTracking()
            .Where(item => item.TenantId == tenantId && !item.IsArchived)
            .Select(item => item.TranslationsJson).ToListAsync(cancellationToken);
        var optionTranslations = await database.ProductOptions.AsNoTracking()
            .Where(item => item.TenantId == tenantId && !item.IsArchived)
            .Select(item => item.TranslationsJson).ToListAsync(cancellationToken);

        if (categoryTranslations.Concat(productTranslations).Concat(groupTranslations).Concat(optionTranslations)
            .Any(translations => !CatalogTranslations.HasTranslation(translations, locale)))
            throw new DomainRuleException("default_translation_required", "defaultLocale",
                "Translate every active menu item into a new default language before switching to it.");
    }

    private async Task<bool> SetCategoryTranslationAsync(Guid tenantId, Guid entityId, string locale, string name,
        CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == entityId && !item.IsArchived, cancellationToken);
        if (category is null) return false;
        category.SetTranslation(locale, name);
        return true;
    }

    private async Task<bool> SetProductTranslationAsync(Guid tenantId, Guid entityId, string locale, string name,
        string? description, CancellationToken cancellationToken)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == entityId && !item.IsArchived, cancellationToken);
        if (product is null) return false;
        product.SetTranslation(locale, name, description);
        return true;
    }

    private async Task<bool> SetOptionGroupTranslationAsync(Guid tenantId, Guid entityId, string locale, string name,
        CancellationToken cancellationToken)
    {
        var group = await database.ProductOptionGroups.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == entityId && !item.IsArchived, cancellationToken);
        if (group is null) return false;
        group.SetTranslation(locale, name);
        return true;
    }

    private async Task<bool> SetOptionTranslationAsync(Guid tenantId, Guid entityId, string locale, string name,
        CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == entityId && !item.IsArchived, cancellationToken);
        if (option is null) return false;
        option.SetTranslation(locale, name);
        return true;
    }

    private static PromotionDiscountDto ToDto(WhitePlate.Domain.Catalog.PromotionDiscount discount) =>
        new(discount.Id, discount.Code, discount.Name, discount.Kind.ToString(), discount.Value, discount.IsActive,
            discount.MinimumOrderAmount, discount.ExpiresOn);

    private static PublishedCatalogSnapshot ToPublishedSnapshot(CatalogManagementDto catalog,
        IReadOnlyList<string> locales, string defaultLocale) => new(catalog.TenantId, catalog.Currency, defaultLocale,
        locales, catalog.Categories, catalog.Products, catalog.OptionGroups, catalog.Options, catalog.Discounts);

    private async Task<MenuDto> MapPublishedMenuAsync(TenantDto tenant, WhitePlate.Domain.Tenants.Tenant restaurant,
        PublishedCatalogSnapshot snapshot, string? requestedLocale, CancellationToken cancellationToken)
    {
        var locale = MenuLocale.TryCreate(requestedLocale, out var normalized) &&
                     snapshot.Locales.Contains(normalized!.Value, StringComparer.OrdinalIgnoreCase)
            ? normalized.Value
            : snapshot.DefaultLocale;
        var categories = snapshot.Categories.Where(category => !category.IsArchived && category.IsVisible)
            .OrderBy(category => category.SortOrder).ThenBy(category => category.Id).ToArray();
        var categoryIds = categories.Select(category => category.Id).ToHashSet();
        var products = snapshot.Products.Where(product => !product.IsArchived && categoryIds.Contains(product.CategoryId))
            .OrderBy(product => product.SortOrder).ThenBy(product => product.Id).ToArray();
        var productIds = products.Select(product => product.Id).ToHashSet();
        var groups = snapshot.OptionGroups.Where(group => !group.IsArchived && productIds.Contains(group.ProductId))
            .OrderBy(group => group.SortOrder).ThenBy(group => group.Id).ToArray();
        var groupIds = groups.Select(group => group.Id).ToHashSet();
        var options = snapshot.Options.Where(option => !option.IsArchived && groupIds.Contains(option.GroupId))
            .OrderBy(option => option.SortOrder).ThenBy(option => option.Id).ToArray();
        var photos = await database.MediaAssets.AsNoTracking().Where(asset => asset.TenantId == tenant.Id &&
                asset.ProductId != null && productIds.Contains(asset.ProductId.Value) && asset.IsActive && asset.IsReady)
            .OrderBy(asset => asset.SortOrder).ThenBy(asset => asset.Id).ToListAsync(cancellationToken);
        var groupsByProduct = groups.GroupBy(group => group.ProductId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<MenuOptionGroupDto>)group.Select(item => new MenuOptionGroupDto(item.Id,
                ResolveText(item.Name, null, item.Translations, locale, snapshot.DefaultLocale).Name,
                item.MinimumSelections, item.MaximumSelections, item.SortOrder,
                options.Where(option => option.GroupId == item.Id).Select(option => new MenuOptionDto(option.Id,
                    ResolveText(option.Name, null, option.Translations, locale, snapshot.DefaultLocale).Name,
                    option.PriceAdjustment, option.SortOrder)).ToArray())).ToArray());
        var productsByCategory = products.GroupBy(product => product.CategoryId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<MenuProductDto>)group.Select(item =>
            {
                var text = ResolveText(item.Name, item.Description, item.Translations, locale, snapshot.DefaultLocale);
                return new MenuProductDto(item.Id, text.Name, text.Description, item.BasePrice, item.TaxRatePercent,
                    item.SortOrder, groupsByProduct.GetValueOrDefault(item.Id, []))
                {
                    IsAvailable = item.IsAvailable,
                    ContainsAllergens = item.ContainsAllergens,
                    MayContainAllergens = item.MayContainAllergens,
                    DietaryTags = item.DietaryTags,
                    PreparationMinutes = item.PreparationMinutes,
                    PreparationNotes = item.PreparationNotes,
                    Photos = photos.Where(asset => asset.ProductId == item.Id).Select(asset =>
                        new WhitePlate.Application.Media.ProductPhotoDto(asset.Id, asset.Width, asset.Height, asset.Bytes)).ToArray()
                };
            }).ToArray());

        return new MenuDto(tenant.Id, tenant.Name, snapshot.Currency, locale, snapshot.DefaultLocale,
            snapshot.Locales, categories.Select(category => new MenuCategoryDto(category.Id,
                ResolveText(category.Name, null, category.Translations, locale, snapshot.DefaultLocale).Name,
                category.SortOrder, productsByCategory.GetValueOrDefault(category.Id, []))).ToArray())
        {
            RestaurantDescription = ResolvePublishedDescription(restaurant, locale, snapshot.DefaultLocale),
            Establishment = PublicEstablishmentDto.FromTenant(restaurant, locale, snapshot.Locales,
                snapshot.DefaultLocale)
        };
    }

    private static string? ResolvePublishedDescription(WhitePlate.Domain.Tenants.Tenant restaurant,
        string locale, string defaultLocale)
    {
        var translations = restaurant.GetDescriptionTranslations();

        return translations.GetValueOrDefault(locale) ?? translations.GetValueOrDefault(defaultLocale);
    }

    private static CatalogLocalizedText ResolveText(string name, string? description,
        IReadOnlyDictionary<string, CatalogLocalizedText> translations, string locale, string defaultLocale)
    {
        if (translations.TryGetValue(locale, out var translated)) return translated;
        if (translations.FirstOrDefault(pair => string.Equals(pair.Key, locale,
                StringComparison.OrdinalIgnoreCase)) is { Value: not null } caseInsensitive)
            return caseInsensitive.Value;
        if (translations.TryGetValue(defaultLocale, out var fallback)) return fallback;
        if (translations.FirstOrDefault(pair => string.Equals(pair.Key, defaultLocale,
                StringComparison.OrdinalIgnoreCase)) is { Value: not null } defaultCaseInsensitive)
            return defaultCaseInsensitive.Value;
        return new CatalogLocalizedText(name, description);
    }

    private static MenuProductDto ToMenuProductDto(Product product) =>
        new(product.Id, product.Name, product.Description, product.BasePrice, product.TaxRatePercent,
            product.SortOrder, [])
        {
            IsAvailable = product.IsAvailable,
            ContainsAllergens = product.ContainsAllergens,
            MayContainAllergens = product.MayContainAllergens,
            DietaryTags = product.DietaryTags,
            PreparationMinutes = product.PreparationMinutes,
            PreparationNotes = product.PreparationNotes
        };
}
