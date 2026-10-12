namespace WhitePlate.Domain.Orders;

public sealed class PickupSlotUsage
{
    public Guid TenantId { get; private set; }
    public long SlotStartTicks { get; private set; }
    public int ReservedCount { get; private set; }

    private PickupSlotUsage() { }

    public static PickupSlotUsage Create(Guid tenantId, long slotStartTicks) => new()
    {
        TenantId = tenantId,
        SlotStartTicks = slotStartTicks,
        ReservedCount = 0
    };
}

public sealed class PickupSlotReservation
{
    public Guid OrderId { get; private set; }
    public Guid TenantId { get; private set; }
    public long SlotStartTicks { get; private set; }
    public DateTimeOffset? ReleasedAt { get; private set; }

    private PickupSlotReservation() { }

    public static PickupSlotReservation Create(Guid orderId, Guid tenantId, long slotStartTicks) => new()
    {
        OrderId = orderId,
        TenantId = tenantId,
        SlotStartTicks = slotStartTicks
    };

    public bool Release(DateTimeOffset now)
    {
        if (ReleasedAt.HasValue) return false;
        ReleasedAt = now;
        return true;
    }
}
