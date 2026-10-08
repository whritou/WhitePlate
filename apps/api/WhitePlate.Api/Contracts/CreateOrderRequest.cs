namespace WhitePlate.Api.Contracts;

public sealed record CreateOrderRequest(string? CustomerName, string? DiscountCode, string? MenuLocale,
    IReadOnlyList<CreateOrderItemRequest>? Items, string? TrackingToken = null);
public sealed record CreateOrderItemRequest(Guid ProductId, int Quantity, IReadOnlyList<Guid>? OptionIds);
public sealed record OrderTrackingRequest(string? Token);
