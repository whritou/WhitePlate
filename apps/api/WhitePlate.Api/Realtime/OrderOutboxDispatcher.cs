using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Realtime;

public sealed class OrderOutboxDispatcher(IServiceScopeFactory scopeFactory, TimeProvider timeProvider,
    ILogger<OrderOutboxDispatcher> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        DateTimeOffset? nextIdempotencyCleanup = null;
        while (!stoppingToken.IsCancellationRequested)
        {
            var foundWork = false;
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var store = scope.ServiceProvider.GetRequiredService<IOutboxStore>();
                var orders = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var publisher = scope.ServiceProvider.GetRequiredService<IOrderEventPublisher>();
                var now = timeProvider.GetUtcNow();
                if (nextIdempotencyCleanup is null || now >= nextIdempotencyCleanup)
                {
                    await orders.DeleteExpiredIdempotencyRecordsAsync(now, stoppingToken);
                    nextIdempotencyCleanup = now.AddMinutes(1);
                }
                var batch = await store.ClaimBatchAsync(now, now.AddMinutes(1), 50, stoppingToken);
                foundWork = batch.Count > 0;
                foreach (var pending in batch)
                {
                    try
                    {
                        var message = JsonSerializer.Deserialize<KitchenOrderEvent>(pending.PayloadJson, JsonOptions)
                                      ?? throw new JsonException("Outbox payload is empty.");
                        await publisher.PublishAsync(message, stoppingToken);
                        await store.MarkDispatchedAsync(pending.Id, timeProvider.GetUtcNow(), stoppingToken);
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception exception)
                    {
                        var delaySeconds = Math.Min(300, 1 << Math.Min(pending.Attempts, 8));
                        await store.ScheduleRetryAsync(pending.Id, timeProvider.GetUtcNow().AddSeconds(delaySeconds),
                            stoppingToken);
                        logger.LogWarning("Kitchen event {EventId} delivery failed ({ExceptionType}); retry scheduled.",
                            pending.Id, exception.GetType().Name);
                    }
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError("Kitchen outbox polling failed ({ExceptionType}).", exception.GetType().Name);
            }

            if (!foundWork)
            {
                try { await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken); }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            }
        }
    }
}
