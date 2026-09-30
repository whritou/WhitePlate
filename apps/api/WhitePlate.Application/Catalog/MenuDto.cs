namespace WhitePlate.Application.Catalog;

public sealed record MenuOptionDto(Guid Id, string Name, decimal PriceAdjustment, int SortOrder);
public sealed record MenuOptionGroupDto(Guid Id, string Name, int MinimumSelections, int MaximumSelections,
    int SortOrder, IReadOnlyList<MenuOptionDto> Options);
public sealed record MenuProductDto(Guid Id, string Name, string? Description, decimal BasePrice,
    decimal TaxRatePercent, int SortOrder, IReadOnlyList<MenuOptionGroupDto> OptionGroups);
public sealed record MenuCategoryDto(Guid Id, string Name, int SortOrder, IReadOnlyList<MenuProductDto> Products);
public sealed record PromotionDiscountDto(Guid Id, string Code, string Name, string Kind, decimal Value, bool IsActive);
public sealed record CatalogCategoryAdminDto(Guid Id, string Name, int SortOrder, bool IsArchived);
public sealed record CatalogProductAdminDto(Guid Id, Guid CategoryId, string Name, string? Description,
    decimal BasePrice, decimal TaxRatePercent, int SortOrder, bool IsAvailable, bool IsArchived);
public sealed record CatalogOptionGroupAdminDto(Guid Id, Guid ProductId, string Name, int MinimumSelections,
    int MaximumSelections, int SortOrder, bool IsArchived);
public sealed record CatalogOptionAdminDto(Guid Id, Guid GroupId, string Name, decimal PriceAdjustment,
    int SortOrder, bool IsArchived);
public sealed record CatalogManagementDto(Guid TenantId, string Currency,
    IReadOnlyList<CatalogCategoryAdminDto> Categories, IReadOnlyList<CatalogProductAdminDto> Products,
    IReadOnlyList<CatalogOptionGroupAdminDto> OptionGroups, IReadOnlyList<CatalogOptionAdminDto> Options,
    IReadOnlyList<PromotionDiscountDto> Discounts);
public sealed record MenuDto(Guid TenantId, string RestaurantName, string Currency,
    IReadOnlyList<MenuCategoryDto> Categories);
