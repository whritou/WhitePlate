using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;
using System.Net.Mail;

namespace WhitePlate.Domain.Orders;

public sealed class Order
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Currency { get; private set; } = null!;
    public string CustomerName { get; private set; } = null!;
    public string? CustomerEmail { get; private set; }
    public DateTimeOffset? EmailUpdatesConsentedAt { get; private set; }
    public string? EmailTrackingTokenHash { get; private set; }
    public string? MenuLocale { get; private set; }
    public string? DiscountCode { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal TaxAmount { get; private set; }
    public decimal Total { get; private set; }
    public OrderStatus Status { get; private set; }
    public OrderCancellationReason? CancellationReason { get; private set; }
    public int Version { get; private set; }
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset? PickupAt { get; private set; }
    public long? PickupAtTicks { get; private set; }
    public string? PickupTimeZone { get; private set; }
    public PickupMode? PickupMode { get; private set; }
    public long CreatedAtTicks { get; private set; }
    public DateTimeOffset? PreparingAt { get; private set; }
    public long? PreparingAtTicks { get; private set; }
    public DateTimeOffset? ReadyAt { get; private set; }
    public long? ReadyAtTicks { get; private set; }
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
        DateTimeOffset? trackingTokenExpiresAt = null, DateTimeOffset? pickupAt = null,
        string? pickupTimeZone = null, PickupMode? pickupMode = null, string? customerEmail = null,
        DateTimeOffset? emailUpdatesConsentedAt = null, string? emailTrackingTokenHash = null,
        Guid? id = null)
    {
        var normalizedCurrency = currency?.ToUpperInvariant();
        var normalizedName = customerName?.Trim();
        if (tenantId == Guid.Empty) throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        if (normalizedCurrency is not ("EUR" or "USD" or "GBP")) throw new DomainRuleException("invalid_currency", "currency", "Currency must be EUR, USD, or GBP.");
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 160) throw new DomainRuleException("invalid_customer_name", "customerName", "Customer name must contain 1 to 160 characters.");
        if (lines is null || lines.Count is 0 or > 50) throw new DomainRuleException("invalid_lines", "items", "An order must contain 1 to 50 items.");
        if (pickupMode.HasValue && (!pickupAt.HasValue || !Enum.IsDefined(pickupMode.Value)))
            throw new DomainRuleException("invalid_pickup", "pickupAt", "A pickup mode requires a resolved pickup time and a valid mode.");
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
            trackingTokenHash.Any(character => !Uri.IsHexDigit(character))))
            throw new DomainRuleException("invalid_tracking_token", "trackingToken", "The order tracking token is invalid.");
        if ((trackingTokenHash is not null || emailTrackingTokenHash is not null) &&
            (!trackingTokenExpiresAt.HasValue || trackingTokenExpiresAt <= createdAt))
            throw new DomainRuleException("invalid_tracking_token", "trackingToken", "The order tracking token is invalid.");
        if (trackingTokenHash is null && emailTrackingTokenHash is null && trackingTokenExpiresAt.HasValue)
            throw new DomainRuleException("invalid_tracking_token", "trackingToken", "The order tracking token is invalid.");
        var normalizedEmail = NormalizeEmail(customerEmail);
        if ((normalizedEmail is null && (emailUpdatesConsentedAt is not null || emailTrackingTokenHash is not null)) ||
            (normalizedEmail is not null && emailUpdatesConsentedAt is null))
            throw new DomainRuleException("email_consent_required", "emailUpdatesConsent",
                "An email address can only be stored after the guest opts in to order updates.");
        if (normalizedEmail is not null && emailUpdatesConsentedAt != createdAt)
            throw new DomainRuleException("invalid_email_consent", "emailUpdatesConsent", "The order email consent time is invalid.");
        if (emailTrackingTokenHash is not null && (emailTrackingTokenHash.Length != 64 ||
            emailTrackingTokenHash.Any(character => !Uri.IsHexDigit(character))))
            throw new DomainRuleException("invalid_email_tracking_token", "emailUpdatesConsent", "The email tracking token is invalid.");
        return new Order
        {
            Id = id ?? Guid.NewGuid(), TenantId = tenantId, Currency = normalizedCurrency, CustomerName = normalizedName,
            CustomerEmail = normalizedEmail, EmailUpdatesConsentedAt = emailUpdatesConsentedAt,
            EmailTrackingTokenHash = emailTrackingTokenHash?.ToLowerInvariant(),
            MenuLocale = normalizedMenuLocale,
            DiscountCode = string.IsNullOrWhiteSpace(discountCode) ? null : discountCode.Trim().ToUpperInvariant(),
            Subtotal = subtotal, DiscountAmount = discountAmount, TaxAmount = orderLines.Sum(line => line.TaxAmount),
            Total = orderLines.Sum(line => line.Total), Status = OrderStatus.Pending, Version = 1,
            CreatedAt = createdAt, CreatedAtTicks = createdAt.UtcDateTime.Ticks, PickupAt = pickupAt,
            PickupAtTicks = pickupAt?.UtcDateTime.Ticks,
            PickupTimeZone = pickupTimeZone,
            PickupMode = pickupMode,
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
        if (status == OrderStatus.Preparing)
        {
            PreparingAt = occurredAt;
            PreparingAtTicks = occurredAt.UtcDateTime.Ticks;
        }
        if (status == OrderStatus.Ready)
        {
            ReadyAt = occurredAt;
            ReadyAtTicks = occurredAt.UtcDateTime.Ticks;
        }
        if (status == OrderStatus.Completed)
        {
            ClosedAt = occurredAt;
            ClosedAtTicks = occurredAt.UtcDateTime.Ticks;
            ClearEmailUpdates();
        }
        Version++;
    }

    public void Cancel(DateTimeOffset occurredAt, OrderCancellationReason reason)
    {
        if (!Enum.IsDefined(reason))
            throw new DomainRuleException("invalid_cancellation_reason", "cancellationReason",
                "Select a valid cancellation reason.");
        if (Status is OrderStatus.Completed or OrderStatus.Cancelled) throw new InvalidOrderTransitionException();
        CancellationReason = reason;
        Status = OrderStatus.Cancelled;
        ClosedAt = occurredAt;
        ClosedAtTicks = occurredAt.UtcDateTime.Ticks;
        ClearEmailUpdates();
        Version++;
    }

    public void ClearExpiredEmailData(DateTimeOffset now)
    {
        if ((TrackingTokenExpiresAt ?? CreatedAt.AddDays(30)) > now) return;
        ClearEmailUpdates();
        EmailTrackingTokenHash = null;
    }

    private void ClearEmailUpdates()
    {
        CustomerEmail = null;
        EmailUpdatesConsentedAt = null;
    }

    private static string? NormalizeEmail(string? email)
    {
        if (email is null) return null;
        var normalized = email.Trim();
        if (normalized.Length is 0 or > 254) throw InvalidEmail();
        try
        {
            var parsed = new MailAddress(normalized);
            if (!string.Equals(parsed.Address, normalized, StringComparison.OrdinalIgnoreCase) ||
                parsed.DisplayName.Length != 0 || normalized.Any(char.IsWhiteSpace)) throw InvalidEmail();
        }
        catch (FormatException)
        {
            throw InvalidEmail();
        }
        return normalized.ToLowerInvariant();
    }

    private static DomainRuleException InvalidEmail() => new("invalid_customer_email", "customerEmail",
        "Enter a valid email address.");
}
