namespace WhitePlate.Api.Contracts;

public sealed record CreateOrderRequest(string? CustomerName, string? DiscountCode, string? MenuLocale,
    IReadOnlyList<CreateOrderItemRequest>? Items, string? TrackingToken = null, DateTimeOffset? PickupAt = null,
    string? CustomerEmail = null, bool EmailUpdatesConsented = false,
    bool AnalyticsConsented = false, string? AnalyticsSource = null,
    string? CustomerPhone = null, string? OrderNotes = null);
public sealed record CreateOrderItemRequest(Guid ProductId, int Quantity, IReadOnlyList<Guid>? OptionIds);
public sealed record OrderTrackingRequest(string? Token);
public sealed record QuoteOrderRequest(string? DiscountCode, string? MenuLocale,
    IReadOnlyList<CreateOrderItemRequest>? Items);
