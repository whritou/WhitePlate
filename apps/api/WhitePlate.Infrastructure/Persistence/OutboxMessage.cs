namespace WhitePlate.Infrastructure.Persistence;

public sealed class OutboxMessage
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string EventType { get; private set; } = null!;
    public string PayloadJson { get; private set; } = null!;
    public DateTimeOffset OccurredAt { get; private set; }
    public DateTimeOffset AvailableAt { get; private set; }
    public DateTimeOffset? LeaseUntil { get; private set; }
    public int LeaseVersion { get; private set; }
    public int Attempts { get; private set; }
    public DateTimeOffset? DispatchedAt { get; private set; }

    private OutboxMessage() { }

    public static OutboxMessage Create(Guid id, Guid tenantId, string eventType, string payloadJson,
        DateTimeOffset occurredAt) => new()
    {
        Id = id, TenantId = tenantId, EventType = eventType,
        PayloadJson = payloadJson, OccurredAt = occurredAt, AvailableAt = occurredAt
    };

    public void Lease(DateTimeOffset until)
    {
        LeaseUntil = until;
        LeaseVersion++;
        Attempts++;
    }

    public void MarkDispatched(DateTimeOffset at)
    {
        DispatchedAt = at;
        LeaseUntil = null;
    }

    public void ScheduleRetry(DateTimeOffset retryAt)
    {
        AvailableAt = retryAt;
        LeaseUntil = null;
    }
}
