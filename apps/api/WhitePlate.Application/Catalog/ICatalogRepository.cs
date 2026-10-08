using WhitePlate.Application.Tenants;

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
        decimal basePrice, decimal taxRatePercent, int sortOrder, bool isAvailable, CancellationToken cancellationToken);
    Task<MenuOptionGroupDto?> UpdateOptionGroupAsync(Guid tenantId, Guid groupId, string name, int minimumSelections,
        int maximumSelections, int sortOrder, CancellationToken cancellationToken);
    Task<MenuOptionDto?> UpdateOptionAsync(Guid tenantId, Guid optionId, string name, decimal priceAdjustment,
        int sortOrder, CancellationToken cancellationToken);
    Task<PromotionDiscountDto?> UpdateDiscountAsync(Guid tenantId, Guid discountId, string name,
        WhitePlate.Domain.Catalog.DiscountKind kind, decimal value, CancellationToken cancellationToken);
    Task<bool> ArchiveCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken);
    Task<bool> SetCategoryVisibilityAsync(Guid tenantId, Guid categoryId, bool isVisible,
        CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> ArchiveProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken);
    Task<bool> RestoreProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> ArchiveOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken);
    Task<bool> ArchiveOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken);
    Task<bool> DeactivateDiscountAsync(Guid tenantId, Guid discountId, CancellationToken cancellationToken);
}
