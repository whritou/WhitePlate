namespace WhitePlate.Api.Contracts;

public sealed record UpdateMenuCategoryRequest(string Name, int SortOrder);
public sealed record UpdateCategoryVisibilityRequest(bool? IsVisible);
public sealed record UpdateProductAvailabilityRequest(bool? IsAvailable);
public sealed record UpdateMenuProductRequest(string Name, string? Description, decimal BasePrice,
    decimal TaxRatePercent, int SortOrder, bool IsAvailable, Guid? CategoryId = null, string? Sku = null,
    IReadOnlyList<string>? ContainsAllergens = null, IReadOnlyList<string>? MayContainAllergens = null,
    IReadOnlyList<string>? DietaryTags = null, int? PreparationMinutes = null,
    IReadOnlyDictionary<string, string>? PreparationNotes = null);
public sealed record UpdateOptionGroupRequest(string Name, int MinimumSelections, int MaximumSelections,
    int SortOrder);
public sealed record UpdateOptionRequest(string Name, decimal PriceAdjustment, int SortOrder);
public sealed record UpdateDiscountRequest(string Name, string Kind, decimal Value,
    decimal MinimumOrderAmount = 0m, DateOnly? ExpiresOn = null);
public sealed record UpdateMenuLanguagesRequest(IReadOnlyList<string> Locales, string DefaultLocale);
public sealed record UpdateCatalogTranslationRequest(string Locale, string Name, string? Description);
public sealed record UpdateRestaurantDescriptionRequest(string? Description);
