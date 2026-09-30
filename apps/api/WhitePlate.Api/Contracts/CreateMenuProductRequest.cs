namespace WhitePlate.Api.Contracts;

public sealed record CreateMenuProductRequest(Guid CategoryId, string Name, string? Description,
    decimal BasePrice, decimal TaxRatePercent, int SortOrder);
