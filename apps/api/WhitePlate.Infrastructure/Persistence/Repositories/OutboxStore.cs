using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Orders;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OutboxStore(WhitePlateDbContext database) : IOutboxStore
{
    public async Task<IReadOnlyList<PendingKitchenEvent>> ClaimBatchAsync(DateTimeOffset now,
        DateTimeOffset leaseUntil, int batchSize, CancellationToken cancellationToken)
    {
        var candidates = await database.OrderOutboxMessages.Where(message => message.DispatchedAt == null &&
                message.AvailableAt <= now && (message.LeaseUntil == null || message.LeaseUntil <= now))
            .OrderBy(message => message.OccurredAt).ThenBy(message => message.Id)
            .Take(Math.Clamp(batchSize, 1, 200)).ToListAsync(cancellationToken);
        var claimed = new List<PendingKitchenEvent>(candidates.Count);
        foreach (var message in candidates)
        {
            message.Lease(leaseUntil);
            try
            {
                await database.SaveChangesAsync(cancellationToken);
                claimed.Add(new PendingKitchenEvent(message.Id, message.PayloadJson, message.Attempts));
            }
            catch (DbUpdateConcurrencyException)
            {
                database.Entry(message).State = EntityState.Detached;
            }
        }
        return claimed;
    }

    public async Task MarkDispatchedAsync(Guid id, DateTimeOffset dispatchedAt,
        CancellationToken cancellationToken)
    {
        var message = await database.OrderOutboxMessages.SingleOrDefaultAsync(item => item.Id == id,
            cancellationToken);
        if (message is null || message.DispatchedAt is not null) return;
        message.MarkDispatched(dispatchedAt);
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task ScheduleRetryAsync(Guid id, DateTimeOffset retryAt,
        CancellationToken cancellationToken)
    {
        var message = await database.OrderOutboxMessages.SingleOrDefaultAsync(item => item.Id == id,
            cancellationToken);
        if (message is null || message.DispatchedAt is not null) return;
        message.ScheduleRetry(retryAt);
        await database.SaveChangesAsync(cancellationToken);
    }
}
