using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class CatalogRepository(WhitePlateDbContext database) : ICatalogRepository
{
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

    public async Task<CatalogManagementDto?> GetManagementCatalogAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var currency = await database.Tenants.AsNoTracking().Where(tenant => tenant.Id == tenantId)
            .Select(tenant => tenant.Currency).SingleOrDefaultAsync(cancellationToken);
        if (currency is null) return null;
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
        return new CatalogManagementDto(tenantId, currency,
            categories.Select(item => new CatalogCategoryAdminDto(item.Id, item.Name, item.SortOrder, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            products.Select(item => new CatalogProductAdminDto(item.Id, item.CategoryId, item.Name, item.Description,
                item.BasePrice, item.TaxRatePercent, item.SortOrder, item.IsAvailable, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            groups.Select(item => new CatalogOptionGroupAdminDto(item.Id, item.ProductId, item.Name,
                item.MinimumSelections, item.MaximumSelections, item.SortOrder, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            options.Select(item => new CatalogOptionAdminDto(item.Id, item.GroupId, item.Name,
                item.PriceAdjustment, item.SortOrder, item.IsArchived)
                { Translations = CatalogTranslations.GetAll(item.TranslationsJson) }).ToArray(),
            discounts.Select(ToDto).ToArray());
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
        CancellationToken cancellationToken)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId && !item.IsArchived, cancellationToken);
        if (product is null) return null;
        product.Update(name, description, basePrice, taxRatePercent, sortOrder, isAvailable);
        product.SetTranslation(await GetDefaultLocaleAsync(tenantId, cancellationToken), name, description);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuProductDto(product.Id, product.Name, product.Description, product.BasePrice,
            product.TaxRatePercent, product.SortOrder, []);
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
        WhitePlate.Domain.Catalog.DiscountKind kind, decimal value, CancellationToken cancellationToken)
    {
        var discount = await database.PromotionDiscounts.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == discountId && item.IsActive, cancellationToken);
        if (discount is null) return null;
        discount.Update(name, kind, value);
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

    public async Task<bool> ArchiveOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == optionId && !item.IsArchived, cancellationToken);
        if (option is null) return false;
        option.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
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
        database.Products.Add(product);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public Task<MenuDto> GetMenuAsync(TenantDto tenant, CancellationToken cancellationToken) =>
        GetMenuAsync(tenant, null, cancellationToken);

    public async Task<MenuDto> GetMenuAsync(TenantDto tenant, string? requestedLocale,
        CancellationToken cancellationToken)
    {
        var locale = MenuLocale.TryCreate(requestedLocale, out var normalizedLocale) &&
                     tenant.MenuLocales.Contains(normalizedLocale!.Value, StringComparer.OrdinalIgnoreCase)
            ? normalizedLocale.Value
            : tenant.DefaultMenuLocale;
        var categories = await database.MenuCategories.AsNoTracking()
            .Where(category => category.TenantId == tenant.Id && !category.IsArchived)
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
                product.IsAvailable })
            .ToListAsync(cancellationToken);
        var productIds = products.Select(product => product.Id).ToArray();
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
                groupsByProduct.GetValueOrDefault(item.Id, [])) { IsAvailable = item.IsAvailable }).ToArray());
        return new MenuDto(tenant.Id, tenant.Name, tenant.Currency, locale, tenant.DefaultMenuLocale,
            tenant.MenuLocales, categories.Select(category =>
            new MenuCategoryDto(category.Id,
                CatalogTranslations.Get(category.TranslationsJson, locale, tenant.DefaultMenuLocale, category.Name).Name,
                category.SortOrder,
                productsByCategory.GetValueOrDefault(category.Id, []))).ToArray());
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
        new(discount.Id, discount.Code, discount.Name, discount.Kind.ToString(), discount.Value, discount.IsActive);
}
