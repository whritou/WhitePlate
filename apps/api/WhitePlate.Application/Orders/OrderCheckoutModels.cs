using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed record CheckoutOptionDto(Guid Id, string Name, decimal PriceAdjustment);
public sealed record CheckoutOptionGroupDto(Guid Id, int MinimumSelections, int MaximumSelections,
    IReadOnlyList<CheckoutOptionDto> Options);
public sealed record CheckoutProductDto(Guid Id, string Name, decimal BasePrice, decimal TaxRatePercent,
    IReadOnlyList<CheckoutOptionGroupDto> OptionGroups)
{
    public IReadOnlyList<string> ContainsAllergens { get; init; } = [];
    public IReadOnlyList<string> MayContainAllergens { get; init; } = [];
    public IReadOnlyList<string> DietaryTags { get; init; } = [];
    public int? PreparationMinutes { get; init; }
    public IReadOnlyDictionary<string, string> PreparationNotes { get; init; } = new Dictionary<string, string>();
}
public sealed record CheckoutDiscountDto(string Code, DiscountKind Kind, decimal Value,
    decimal MinimumOrderAmount = 0m, DateOnly? ExpiresOn = null);
public sealed record CheckoutLocaleDto(string Locale, string DefaultLocale);
public sealed record CheckoutCatalogDto(string Currency, string Locale, IReadOnlyList<CheckoutProductDto> Products,
    CheckoutDiscountDto? Discount, string TimeZone = "UTC");
public sealed record PickupAvailabilityDto(string State, string? TimeZone, IReadOnlyList<WhitePlate.Domain.Tenants.PickupSlot> Slots)
{
    public bool AcceptingOrders { get; init; } = true;
    public bool RushHoldEnabled { get; init; }
    public int RushBufferMinutes { get; init; }
}

public sealed record CreateOrderItem(Guid ProductId, int Quantity, IReadOnlyList<Guid>? OptionIds);
public sealed record CreateOrderCommand(Guid TenantId, string? CustomerName, string? DiscountCode,
    string? MenuLocale, IReadOnlyList<CreateOrderItem>? Items, string? IdempotencyKey,
    string? TrackingToken = null, DateTimeOffset? PickupAt = null, string? CustomerEmail = null,
    bool EmailUpdatesConsented = false, bool AnalyticsConsented = false,
    string AnalyticsSource = "web", string? CustomerPhone = null, string? OrderNotes = null);

public sealed record AnalyticsFingerprint(string KeyVersion, string Hash, DateTimeOffset ExpiresAt);

public interface IAnalyticsPrivacyService
{
    AnalyticsFingerprintLookup CreateLookup(Guid tenantId, string? email);
}

public enum AnalyticsFingerprintLookupStatus { InvalidEmail, Unavailable, Available }

public sealed record AnalyticsFingerprintLookup(AnalyticsFingerprintLookupStatus Status, string? CurrentKeyVersion,
    IReadOnlyList<(string KeyVersion, string Hash)> Hashes);

public sealed record EmailTrackingCapability(string Token, string TokenHash);

public interface IEmailTrackingCapability
{
    EmailTrackingCapability? Create(Guid tenantId, Guid orderId, DateTimeOffset expiresAt);
}

public sealed record OrderLineOptionDto(Guid OptionId, string Name, decimal PriceAdjustment);
public sealed record OrderLineReceiptDto(Guid ProductId, string ProductName, decimal BaseUnitPrice,
    decimal TaxRatePercent, int Quantity, decimal Subtotal, decimal DiscountAmount, decimal TaxAmount,
    decimal Total, IReadOnlyList<OrderLineOptionDto> Options)
{
    public IReadOnlyList<string> ContainsAllergens { get; init; } = [];
    public IReadOnlyList<string> MayContainAllergens { get; init; } = [];
    public IReadOnlyList<string> DietaryTags { get; init; } = [];
    public int? PreparationMinutes { get; init; }
    public IReadOnlyDictionary<string, string> PreparationNotes { get; init; } = new Dictionary<string, string>();
}
public sealed record OrderReceiptDto(Guid Id, Guid TenantId, string Currency, string CustomerName,
    string? MenuLocale, string? DiscountCode, decimal Subtotal, decimal DiscountAmount, decimal TaxAmount, decimal Total,
    string Status, int Version, DateTimeOffset CreatedAt, IReadOnlyList<OrderLineReceiptDto> Lines)
{
    public DateTimeOffset? PickupAt { get; init; }
    public string? PickupTimeZone { get; init; }
}
public sealed record OrderSummaryOptionDto(Guid OptionId, string Name);
public sealed record OrderSummaryLineDto(Guid ProductId, string ProductName, int Quantity,
    IReadOnlyList<OrderSummaryOptionDto> Options)
{
    public int? PreparationMinutes { get; init; }
    public IReadOnlyDictionary<string, string> PreparationNotes { get; init; } = new Dictionary<string, string>();
}
public sealed record OrderSummaryDto(Guid Id, string CustomerName, string Currency, string? MenuLocale, decimal Total,
    string Status, int Version, DateTimeOffset CreatedAt, IReadOnlyList<OrderSummaryLineDto> Lines)
{
    public string? CustomerPhone { get; init; }
    public string? OrderNotes { get; init; }
    public DateTimeOffset? PickupAt { get; init; }
    public string? PickupTimeZone { get; init; }
    public string? PickupMode { get; init; }
    public string? CancellationReason { get; init; }
    public IReadOnlyList<OrderEmailNotificationDto> EmailNotifications { get; init; } = [];
}
public sealed record OrderEmailNotificationDto(string EventType, string Status, DateTimeOffset CreatedAt,
    DateTimeOffset? AcceptedAt);
public sealed record OrderPageDto(IReadOnlyList<OrderSummaryDto> Items, string? NextCursor, DateTimeOffset ServerTime);
public sealed record OrderPageData(IReadOnlyList<OrderSummaryDto> Items, OrderPageCursor? NextCursor);
public sealed record OrderHistoryPageDto(IReadOnlyList<OrderSummaryDto> Items, int Page, int PageSize, int TotalCount);
public sealed record OrderHistoryPageData(IReadOnlyList<OrderSummaryDto> Items, int TotalCount);
public sealed record PublicOrderTrackingDto(Guid Id, string Status, int Version, DateTimeOffset CreatedAt, string? MenuLocale = null)
{
    public DateTimeOffset? PickupAt { get; init; }
    public string? PickupTimeZone { get; init; }
    public PublicOrderSummaryDto? Summary { get; init; }
}
public sealed record PublicOrderSummaryDto(string Currency, decimal Subtotal, decimal DiscountAmount,
    decimal TaxAmount, decimal Total, IReadOnlyList<PublicOrderLineDto> Lines);
public sealed record PublicOrderLineDto(Guid ProductId, string ProductName, int Quantity, decimal Subtotal,
    decimal Total, IReadOnlyList<OrderLineOptionDto> Options);
public sealed record OrderPageCursor(long CreatedAtTicks, Guid Id);
public sealed record ListOrdersQuery(Guid TenantId, OrderStatus? Status, string? Cursor, int? PageSize);
public sealed record ListOrderHistoryQuery(Guid TenantId, OrderStatus? Status, string? Search, DateOnly? From,
    DateOnly? Through, string Sort, string Direction, int Page, int PageSize);
public sealed record UpdateOrderStatusCommand(Guid TenantId, Guid OrderId, int ExpectedVersion,
    OrderStatus Status, OrderCancellationReason? CancellationReason,
    WhitePlate.Domain.Identity.ExternalIdentity Identity);

public enum IdempotencyOutcome { New, Replayed, Conflict }
public sealed record IdempotencyResult(IdempotencyOutcome Outcome, OrderReceiptDto? Receipt = null);

public static class OrderReceiptMapping
{
    public static OrderReceiptDto ToReceipt(this WhitePlate.Domain.Orders.Order order) => new(
        order.Id, order.TenantId, order.Currency, order.CustomerName, order.MenuLocale, order.DiscountCode,
        order.Subtotal, order.DiscountAmount, order.TaxAmount, order.Total, order.Status.ToString(),
        order.Version, order.CreatedAt,
        order.Lines.Select(line => new OrderLineReceiptDto(line.ProductId, line.ProductName,
            line.BaseUnitPrice, line.TaxRatePercent, line.Quantity, line.Subtotal, line.DiscountAmount,
            line.TaxAmount, line.Total, line.Options.Select(option => new OrderLineOptionDto(
                option.OptionId, option.Name, option.PriceAdjustment)).ToArray())
            {
                ContainsAllergens = line.ContainsAllergens,
                MayContainAllergens = line.MayContainAllergens,
                DietaryTags = line.DietaryTags,
                PreparationMinutes = line.PreparationMinutes,
                PreparationNotes = line.PreparationNotes
            }).ToArray()) { PickupAt = order.PickupAt, PickupTimeZone = order.PickupTimeZone };
}
