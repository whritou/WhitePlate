namespace WhitePlate.Api.Contracts;

public sealed record UpdateMenuCategoryRequest(string Name, int SortOrder);
public sealed record UpdateCategoryVisibilityRequest(bool? IsVisible);
public sealed record UpdateMenuProductRequest(string Name, string? Description, decimal BasePrice,
    decimal TaxRatePercent, int SortOrder, bool IsAvailable);
public sealed record UpdateOptionGroupRequest(string Name, int MinimumSelections, int MaximumSelections,
    int SortOrder);
public sealed record UpdateOptionRequest(string Name, decimal PriceAdjustment, int SortOrder);
public sealed record UpdateDiscountRequest(string Name, string Kind, decimal Value);
public sealed record UpdateMenuLanguagesRequest(IReadOnlyList<string> Locales, string DefaultLocale);
public sealed record UpdateCatalogTranslationRequest(string Locale, string Name, string? Description);
public sealed record UpdateRestaurantDescriptionRequest(string? Description);
