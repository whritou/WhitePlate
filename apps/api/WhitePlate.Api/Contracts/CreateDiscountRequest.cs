namespace WhitePlate.Api.Contracts;

public sealed record CreateDiscountRequest(string Code, string Name, string Kind, decimal Value);
public sealed record DiscountResponse(Guid Id, string Code, string Name, string Kind, decimal Value);
