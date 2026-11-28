using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Realtime;

/// <summary>
/// Archives terminal orders after each restaurant's local midnight. Restaurants use different saved time
/// zones, so the worker runs on every UTC quarter hour (all current zone offsets are multiples of 15 minutes)
/// and the repository archives, per tenant, orders closed before that tenant's current local day start.
/// The query is idempotent, so a run after downtime catches up.
/// </summary>
public sealed class OrderArchiveDispatcher(IServiceScopeFactory scopeFactory, TimeProvider timeProvider,
    ILogger<OrderArchiveDispatcher> logger) : BackgroundService
{
    private static readonly TimeSpan RetryDelay = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan RunInterval = TimeSpan.FromMinutes(15);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var archivedSuccessfully = false;
            try
            {
                var now = timeProvider.GetUtcNow();
                await using var scope = scopeFactory.CreateAsyncScope();
                var orders = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var count = await orders.ArchiveClosedOrdersBeforeLocalDayStartAsync(now, stoppingToken);
                archivedSuccessfully = true;
                if (count > 0) logger.LogInformation("Archived {OrderCount} closed orders from the kitchen board.", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                // Raw exceptions may contain secrets; log the type plus a redacted root-cause message.
                logger.LogError("Order archive failed ({ExceptionType}: {FailureReason}); retrying shortly.",
                    exception.GetType().Name, SafeExceptionDescription.Describe(exception));
            }

            var nowAfterRun = timeProvider.GetUtcNow();
            var delay = archivedSuccessfully ? NextRun(nowAfterRun) - nowAfterRun : RetryDelay;
            try { await Task.Delay(delay, timeProvider, stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    /// <summary>Returns the next UTC quarter-hour boundary strictly after <paramref name="value"/>.</summary>
    public static DateTimeOffset NextRun(DateTimeOffset value)
    {
        var utc = value.UtcDateTime;
        var intervalTicks = RunInterval.Ticks;
        var next = (utc.Ticks / intervalTicks + 1) * intervalTicks;
        return new DateTimeOffset(next, TimeSpan.Zero);
    }
}
