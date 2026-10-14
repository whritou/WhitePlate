namespace WhitePlate.Api.Contracts;

public sealed record CreateDiscountRequest(string Code, string Name, string Kind, decimal Value,
    decimal MinimumOrderAmount = 0m, DateOnly? ExpiresOn = null);
public sealed record DiscountResponse(Guid Id, string Code, string Name, string Kind, decimal Value,
    decimal MinimumOrderAmount = 0m, DateOnly? ExpiresOn = null);
