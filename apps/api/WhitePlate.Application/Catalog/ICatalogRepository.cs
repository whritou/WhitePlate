using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public interface ICatalogRepository
{
    Task<MenuDto> GetMenuAsync(TenantDto tenant, CancellationToken cancellationToken);
    Task<MenuDto> GetMenuAsync(TenantDto tenant, string? locale, CancellationToken cancellationToken) =>
        GetMenuAsync(tenant, cancellationToken);
    Task<MenuLanguageSettingsDto?> GetMenuLanguageSettingsAsync(Guid tenantId, CancellationToken cancellationToken) =>
        Task.FromResult<MenuLanguageSettingsDto?>(null);
    Task<MenuLanguageSettingsDto?> UpdateMenuLanguageSettingsAsync(Guid tenantId, IReadOnlyList<string> locales,
        string defaultLocale, CancellationToken cancellationToken) => Task.FromResult<MenuLanguageSettingsDto?>(null);
    Task<bool> SetTranslationAsync(Guid tenantId, string entityType, Guid entityId, string locale, string name,
        string? description, CancellationToken cancellationToken) => Task.FromResult(false);
    Task<RestaurantDescriptionTranslationsDto?> GetRestaurantDescriptionTranslationsAsync(Guid tenantId,
        CancellationToken cancellationToken) => Task.FromResult<RestaurantDescriptionTranslationsDto?>(null);
    Task<bool> SetRestaurantDescriptionTranslationAsync(Guid tenantId, string locale, string? description,
        CancellationToken cancellationToken) => Task.FromResult(false);
    Task<CatalogManagementDto?> GetManagementCatalogAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ProductAvailabilityDto>> GetProductAvailabilityAsync(Guid tenantId,
        CancellationToken cancellationToken);
    Task<bool> SetProductAvailabilityAsync(Guid tenantId, Guid productId, bool isAvailable,
        CancellationToken cancellationToken);
    Task<bool> SetProductAvailabilityAsync(Guid tenantId, Guid productId, bool isAvailable,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        SetProductAvailabilityAsync(tenantId, productId, isAvailable, cancellationToken);
    Task<bool> CategoryBelongsToTenantAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken);
    Task<MenuCategoryDto> AddCategoryAsync(WhitePlate.Domain.Catalog.MenuCategory category, CancellationToken cancellationToken);
    Task<bool> AddProductAsync(WhitePlate.Domain.Catalog.Product product, CancellationToken cancellationToken);
    Task<bool> ProductBelongsToTenantAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken);
    Task<bool> OptionGroupBelongsToTenantAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken);
    Task<MenuOptionGroupDto> AddOptionGroupAsync(WhitePlate.Domain.Catalog.ProductOptionGroup group, CancellationToken cancellationToken);
    Task<MenuOptionDto> AddOptionAsync(WhitePlate.Domain.Catalog.ProductOption option, CancellationToken cancellationToken);
    Task<bool> AddDiscountAsync(WhitePlate.Domain.Catalog.PromotionDiscount discount, CancellationToken cancellationToken);
    Task<MenuCategoryDto?> UpdateCategoryAsync(Guid tenantId, Guid categoryId, string name, int sortOrder, CancellationToken cancellationToken);
    Task<MenuProductDto?> UpdateProductAsync(Guid tenantId, Guid productId, string name, string? description,
        decimal basePrice, decimal taxRatePercent, int sortOrder, bool isAvailable, CancellationToken cancellationToken,
        Guid? categoryId = null, string? sku = null, IReadOnlyList<string>? containsAllergens = null,
        IReadOnlyList<string>? mayContainAllergens = null, IReadOnlyList<string>? dietaryTags = null,
        int? preparationMinutes = null, IReadOnlyDictionary<string, string>? preparationNotes = null);
    Task<MenuProductDto?> UpdateProductAsync(Guid tenantId, Guid productId, string name, string? description,
        decimal basePrice, decimal taxRatePercent, int sortOrder, bool isAvailable, CancellationToken cancellationToken,
        Guid? categoryId, string? sku, IReadOnlyList<string>? containsAllergens,
        IReadOnlyList<string>? mayContainAllergens, IReadOnlyList<string>? dietaryTags,
        int? preparationMinutes, IReadOnlyDictionary<string, string>? preparationNotes, ExternalIdentity identity) =>
        UpdateProductAsync(tenantId, productId, name, description, basePrice, taxRatePercent, sortOrder,
            isAvailable, cancellationToken, categoryId, sku, containsAllergens, mayContainAllergens,
            dietaryTags, preparationMinutes, preparationNotes);
    Task<MenuOptionGroupDto?> UpdateOptionGroupAsync(Guid tenantId, Guid groupId, string name, int minimumSelections,
        int maximumSelections, int sortOrder, CancellationToken cancellationToken);
    Task<MenuOptionDto?> UpdateOptionAsync(Guid tenantId, Guid optionId, string name, decimal priceAdjustment,
        int sortOrder, CancellationToken cancellationToken);
    Task<PromotionDiscountDto?> UpdateDiscountAsync(Guid tenantId, Guid discountId, string name,
        WhitePlate.Domain.Catalog.DiscountKind kind, decimal value, decimal minimumOrderAmount,
        DateOnly? expiresOn, CancellationToken cancellationToken);
    Task<bool> ArchiveCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken);
    Task<bool> RestoreCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> SetCategoryVisibilityAsync(Guid tenantId, Guid categoryId, bool isVisible,
        CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> ArchiveProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken);
    Task<bool> RestoreProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> ArchiveOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken);
    Task<bool> RestoreOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> ArchiveOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken);
    Task<bool> RestoreOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> DeactivateDiscountAsync(Guid tenantId, Guid discountId, CancellationToken cancellationToken);
    Task<bool> ReorderCatalogAsync(Guid tenantId, string entityType, Guid? parentId, Guid? categoryId,
        IReadOnlyList<Guid> orderedIds, CancellationToken cancellationToken) => Task.FromResult(false);
}
