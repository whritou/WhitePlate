namespace WhitePlate.Api.Contracts;

public sealed record CreateOrderRequest(string? CustomerName, string? DiscountCode, string? MenuLocale,
    IReadOnlyList<CreateOrderItemRequest>? Items);
public sealed record CreateOrderItemRequest(Guid ProductId, int Quantity, IReadOnlyList<Guid>? OptionIds);
