namespace WhitePlate.Application.Orders;

public sealed record KitchenOrderEvent(Guid EventId, Guid TenantId, Guid OrderId, string EventType,
    string Status, int Version, DateTimeOffset OccurredAt);

public sealed record PendingKitchenEvent(Guid Id, string PayloadJson, int Attempts);

public interface IOrderEventPublisher
{
    Task PublishAsync(KitchenOrderEvent message, CancellationToken cancellationToken);
}

public interface IOutboxStore
{
    Task<IReadOnlyList<PendingKitchenEvent>> ClaimBatchAsync(DateTimeOffset now, DateTimeOffset leaseUntil,
        int batchSize, CancellationToken cancellationToken);
    Task MarkDispatchedAsync(Guid id, DateTimeOffset dispatchedAt, CancellationToken cancellationToken);
    Task ScheduleRetryAsync(Guid id, DateTimeOffset retryAt, CancellationToken cancellationToken);
}
