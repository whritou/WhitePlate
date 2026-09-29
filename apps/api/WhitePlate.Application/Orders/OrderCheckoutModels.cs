using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed record CheckoutOptionDto(Guid Id, string Name, decimal PriceAdjustment);
public sealed record CheckoutOptionGroupDto(Guid Id, int MinimumSelections, int MaximumSelections,
    IReadOnlyList<CheckoutOptionDto> Options);
public sealed record CheckoutProductDto(Guid Id, string Name, decimal BasePrice, decimal TaxRatePercent,
    IReadOnlyList<CheckoutOptionGroupDto> OptionGroups);
public sealed record CheckoutDiscountDto(string Code, DiscountKind Kind, decimal Value);
public sealed record CheckoutCatalogDto(string Currency, IReadOnlyList<CheckoutProductDto> Products,
    CheckoutDiscountDto? Discount);

public sealed record CreateOrderItem(Guid ProductId, int Quantity, IReadOnlyList<Guid>? OptionIds);
public sealed record CreateOrderCommand(Guid TenantId, string? CustomerName, string? DiscountCode,
    IReadOnlyList<CreateOrderItem>? Items, string? IdempotencyKey);

public sealed record OrderLineOptionDto(Guid OptionId, string Name, decimal PriceAdjustment);
public sealed record OrderLineReceiptDto(Guid ProductId, string ProductName, decimal BaseUnitPrice,
    decimal TaxRatePercent, int Quantity, decimal Subtotal, decimal DiscountAmount, decimal TaxAmount,
    decimal Total, IReadOnlyList<OrderLineOptionDto> Options);
public sealed record OrderReceiptDto(Guid Id, Guid TenantId, string Currency, string CustomerName,
    string? DiscountCode, decimal Subtotal, decimal DiscountAmount, decimal TaxAmount, decimal Total,
    string Status, int Version, DateTimeOffset CreatedAt, IReadOnlyList<OrderLineReceiptDto> Lines);
public sealed record OrderSummaryDto(Guid Id, string CustomerName, string Currency, decimal Total,
    OrderStatus Status, int Version, DateTimeOffset CreatedAt);
public sealed record OrderPageDto(IReadOnlyList<OrderSummaryDto> Items, string? NextCursor);
public sealed record OrderPageData(IReadOnlyList<OrderSummaryDto> Items, OrderPageCursor? NextCursor);
public sealed record OrderPageCursor(long CreatedAtTicks, Guid Id);
public sealed record ListOrdersQuery(Guid TenantId, OrderStatus? Status, string? Cursor, int? PageSize);
public sealed record UpdateOrderStatusCommand(Guid TenantId, Guid OrderId, int ExpectedVersion,
    OrderStatus Status, WhitePlate.Domain.Identity.ExternalIdentity Identity);

public enum IdempotencyOutcome { New, Replayed, Conflict }
public sealed record IdempotencyResult(IdempotencyOutcome Outcome, OrderReceiptDto? Receipt = null);

public static class OrderReceiptMapping
{
    public static OrderReceiptDto ToReceipt(this WhitePlate.Domain.Orders.Order order) => new(
        order.Id, order.TenantId, order.Currency, order.CustomerName, order.DiscountCode,
        order.Subtotal, order.DiscountAmount, order.TaxAmount, order.Total, order.Status.ToString(),
        order.Version, order.CreatedAt,
        order.Lines.Select(line => new OrderLineReceiptDto(line.ProductId, line.ProductName,
            line.BaseUnitPrice, line.TaxRatePercent, line.Quantity, line.Subtotal, line.DiscountAmount,
            line.TaxAmount, line.Total, line.Options.Select(option => new OrderLineOptionDto(
                option.OptionId, option.Name, option.PriceAdjustment)).ToArray())).ToArray());
}
