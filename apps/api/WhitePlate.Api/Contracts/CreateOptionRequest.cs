namespace WhitePlate.Api.Contracts;

public sealed record CreateOptionRequest(string Name, decimal PriceAdjustment, int SortOrder);
