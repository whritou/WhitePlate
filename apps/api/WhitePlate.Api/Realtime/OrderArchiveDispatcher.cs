using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Realtime;

public sealed class OrderArchiveDispatcher(IServiceScopeFactory scopeFactory, TimeProvider timeProvider,
    ILogger<OrderArchiveDispatcher> logger) : BackgroundService
{
    private static readonly TimeSpan RetryDelay = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var archivedSuccessfully = false;
            try
            {
                var now = timeProvider.GetUtcNow();
                var cutoff = UtcDayStart(now);
                await using var scope = scopeFactory.CreateAsyncScope();
                var orders = scope.ServiceProvider.GetRequiredService<IOrderRepository>();
                var count = await orders.ArchiveClosedOrdersBeforeAsync(cutoff, stoppingToken);
                archivedSuccessfully = true;
                if (count > 0) logger.LogInformation("Archived {OrderCount} closed orders from the kitchen board.", count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError("Daily order archive failed ({ExceptionType}); retrying shortly.", exception.GetType().Name);
            }

            var nowAfterRun = timeProvider.GetUtcNow();
            var nextRun = NextUtcMidnight(nowAfterRun);
            var delay = archivedSuccessfully ? nextRun - nowAfterRun : RetryDelay;
            try { await Task.Delay(delay, timeProvider, stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    public static DateTimeOffset UtcDayStart(DateTimeOffset value)
    {
        var utc = value.UtcDateTime;
        return new DateTimeOffset(utc.Year, utc.Month, utc.Day, 0, 0, 0, TimeSpan.Zero);
    }

    public static DateTimeOffset NextUtcMidnight(DateTimeOffset value) => UtcDayStart(value).AddDays(1);
}
