using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Domain.Orders;

public sealed class Order
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Currency { get; private set; } = null!;
    public string CustomerName { get; private set; } = null!;
    public string? MenuLocale { get; private set; }
    public string? DiscountCode { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal TaxAmount { get; private set; }
    public decimal Total { get; private set; }
    public OrderStatus Status { get; private set; }
    public int Version { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public long CreatedAtTicks { get; private set; }
    public DateTimeOffset? ClosedAt { get; private set; }
    public long? ClosedAtTicks { get; private set; }
    public DateTimeOffset? ArchivedAt { get; private set; }
    public string? TrackingTokenHash { get; private set; }
    public DateTimeOffset? TrackingTokenExpiresAt { get; private set; }
    public List<OrderLine> Lines { get; private set; } = [];
    private Order() { }

    public static Order Create(Guid tenantId, string? currency, string? customerName,
        IReadOnlyList<OrderLineSnapshot>? lines, string? discountCode, decimal discountAmount,
        DateTimeOffset createdAt, string? menuLocale = null, string? trackingTokenHash = null,
        DateTimeOffset? trackingTokenExpiresAt = null)
    {
        var normalizedCurrency = currency?.ToUpperInvariant();
        var normalizedName = customerName?.Trim();
        if (tenantId == Guid.Empty) throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        if (normalizedCurrency is not ("EUR" or "USD" or "GBP")) throw new DomainRuleException("invalid_currency", "currency", "Currency must be EUR, USD, or GBP.");
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 160) throw new DomainRuleException("invalid_customer_name", "customerName", "Customer name must contain 1 to 160 characters.");
        if (lines is null || lines.Count is 0 or > 50) throw new DomainRuleException("invalid_lines", "items", "An order must contain 1 to 50 items.");
        if (lines.GroupBy(line => line.ProductId).Any(group => group.Count() > 1)) throw new DomainRuleException("duplicate_product", "items", "Product lines must be unique.");
        if (lines.Any(line => line.ProductId == Guid.Empty || string.IsNullOrWhiteSpace(line.ProductName) || line.Quantity is < 1 or > 99 ||
            line.BaseUnitPrice < 0 || decimal.Round(line.BaseUnitPrice, 2) != line.BaseUnitPrice ||
            line.TaxRatePercent is < 0 or > 100 || decimal.Round(line.TaxRatePercent, 2) != line.TaxRatePercent ||
            line.Options is null || line.Options.Count > 20 || line.Options.Any(option => option.OptionId == Guid.Empty ||
                string.IsNullOrWhiteSpace(option.Name) || option.PriceAdjustment < 0 || decimal.Round(option.PriceAdjustment, 2) != option.PriceAdjustment)))
            throw new DomainRuleException("invalid_line", "items", "An order item is invalid.");

        var orderLines = lines.Select(line => new OrderLine(line)).ToList();
        var subtotal = orderLines.Sum(line => line.Subtotal);
        if (discountAmount < 0 || decimal.Round(discountAmount, 2) != discountAmount || discountAmount > subtotal)
            throw new DomainRuleException("invalid_discount", "discountCode", "Discount cannot exceed the order subtotal.");
        var remainingDiscount = discountAmount;
        for (var index = 0; index < orderLines.Count; index++)
        {
            var line = orderLines[index];
            var allocation = index == orderLines.Count - 1 ? remainingDiscount :
                subtotal == 0 ? 0 : decimal.Round(discountAmount * line.Subtotal / subtotal, 2, MidpointRounding.AwayFromZero);
            allocation = Math.Min(allocation, remainingDiscount);
            line.SetCalculatedAmounts(allocation);
            remainingDiscount -= allocation;
        }
        var normalizedMenuLocale = menuLocale is null ? null : WhitePlate.Domain.Tenants.MenuLocale.Create(menuLocale).Value;
        if (trackingTokenHash is not null && (trackingTokenHash.Length != 64 ||
            trackingTokenHash.Any(character => !Uri.IsHexDigit(character)) || !trackingTokenExpiresAt.HasValue ||
            trackingTokenExpiresAt <= createdAt))
            throw new DomainRuleException("invalid_tracking_token", "trackingToken", "The order tracking token is invalid.");
        if (trackingTokenHash is null && trackingTokenExpiresAt.HasValue)
            throw new DomainRuleException("invalid_tracking_token", "trackingToken", "The order tracking token is invalid.");
        return new Order
        {
            Id = Guid.NewGuid(), TenantId = tenantId, Currency = normalizedCurrency, CustomerName = normalizedName,
            MenuLocale = normalizedMenuLocale,
            DiscountCode = string.IsNullOrWhiteSpace(discountCode) ? null : discountCode.Trim().ToUpperInvariant(),
            Subtotal = subtotal, DiscountAmount = discountAmount, TaxAmount = orderLines.Sum(line => line.TaxAmount),
            Total = orderLines.Sum(line => line.Total), Status = OrderStatus.Pending, Version = 1,
            CreatedAt = createdAt, CreatedAtTicks = createdAt.UtcDateTime.Ticks,
            TrackingTokenHash = trackingTokenHash?.ToLowerInvariant(), TrackingTokenExpiresAt = trackingTokenExpiresAt,
            Lines = orderLines
        };
    }

    public void TransitionTo(OrderStatus status, DateTimeOffset occurredAt)
    {
        if (Status == status) return;
        if (Status == OrderStatus.Cancelled || Status == OrderStatus.Completed || (int)status != (int)Status + 1)
            throw new InvalidOrderTransitionException();
        Status = status;
        if (status == OrderStatus.Completed)
        {
            ClosedAt = occurredAt;
            ClosedAtTicks = occurredAt.UtcDateTime.Ticks;
        }
        Version++;
    }

    public void Cancel(DateTimeOffset occurredAt)
    {
        if (Status is OrderStatus.Completed or OrderStatus.Cancelled) throw new InvalidOrderTransitionException();
        Status = OrderStatus.Cancelled;
        ClosedAt = occurredAt;
        ClosedAtTicks = occurredAt.UtcDateTime.Ticks;
        Version++;
    }
}
