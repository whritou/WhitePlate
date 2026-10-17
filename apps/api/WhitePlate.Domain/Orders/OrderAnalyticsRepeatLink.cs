namespace WhitePlate.Domain.Orders;

public sealed class OrderAnalyticsRepeatLink
{
    public Guid TenantId { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid PriorOrderId { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }

    private OrderAnalyticsRepeatLink() { }

    internal OrderAnalyticsRepeatLink(Guid tenantId, Guid priorOrderId, DateTimeOffset expiresAt)
    {
        TenantId = tenantId;
        PriorOrderId = priorOrderId;
        ExpiresAt = expiresAt;
    }
}
