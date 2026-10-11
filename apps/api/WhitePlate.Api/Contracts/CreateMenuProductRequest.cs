namespace WhitePlate.Api.Contracts;

public sealed record CreateMenuProductRequest(Guid CategoryId, string Name, string? Description,
    decimal BasePrice, decimal TaxRatePercent, int SortOrder, string? Sku = null,
    IReadOnlyList<string>? ContainsAllergens = null, IReadOnlyList<string>? MayContainAllergens = null,
    IReadOnlyList<string>? DietaryTags = null, int? PreparationMinutes = null,
    IReadOnlyDictionary<string, string>? PreparationNotes = null);
