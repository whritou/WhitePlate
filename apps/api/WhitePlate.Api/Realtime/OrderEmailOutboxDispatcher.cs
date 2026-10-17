using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Api.Configuration;
using WhitePlate.Application.Orders;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Api.Realtime;

public sealed class OrderEmailOutboxDispatcher(IServiceScopeFactory scopeFactory, TimeProvider timeProvider,
    IConfiguration configuration, ILogger<OrderEmailOutboxDispatcher> logger) : BackgroundService
{
    private const int BatchSize = 20;
    private static readonly TimeSpan Lease = TimeSpan.FromMinutes(2);
    private bool _reportedMissingConfiguration;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            if (!await IsConfiguredAsync(stoppingToken))
            {
                await Delay(TimeSpan.FromSeconds(15), stoppingToken);
                continue;
            }

            var foundWork = false;
            try
            {
                for (var index = 0; index < BatchSize; index++)
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
                    var delivery = await ClaimAsync(database, timeProvider.GetUtcNow(), stoppingToken);
                    if (delivery is null) break;
                    foundWork = true;
                    await DeliverAsync(scope.ServiceProvider, database, delivery, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError("Order email outbox polling failed ({ExceptionType}).", exception.GetType().Name);
            }

            if (!foundWork) await Delay(TimeSpan.FromSeconds(2), stoppingToken);
        }
    }

    private async Task<bool> IsConfiguredAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var sender = scope.ServiceProvider.GetRequiredService<ResendOrderEmailSender>();
        if (sender.IsConfigured)
        {
            _reportedMissingConfiguration = false;
            return true;
        }
        if (!_reportedMissingConfiguration)
        {
            logger.LogWarning("Order email delivery is waiting for server-side Resend configuration.");
            _reportedMissingConfiguration = true;
        }
        return false;
    }

    private static async Task<OrderEmailDelivery?> ClaimAsync(WhitePlateDbContext database, DateTimeOffset now,
        CancellationToken ct)
    {
        for (var attempt = 0; attempt < 5; attempt++)
        {
            var id = await database.OrderEmailDeliveries.AsNoTracking().Where(item => item.RecipientEmail != null &&
                    ((item.Status == OrderEmailDeliveryStatus.Pending && item.NextAttemptAt <= now) ||
                     (item.Status == OrderEmailDeliveryStatus.Sending && item.LeaseUntil != null && item.LeaseUntil <= now)))
                .OrderBy(item => item.CreatedAt).Select(item => (Guid?)item.Id).FirstOrDefaultAsync(ct);
            if (id is null) return null;

            var claimed = await database.OrderEmailDeliveries.Where(item => item.Id == id && item.RecipientEmail != null &&
                    ((item.Status == OrderEmailDeliveryStatus.Pending && item.NextAttemptAt <= now) ||
                     (item.Status == OrderEmailDeliveryStatus.Sending && item.LeaseUntil != null && item.LeaseUntil <= now)))
                .ExecuteUpdateAsync(update => update
                    .SetProperty(item => item.Status, OrderEmailDeliveryStatus.Sending)
                    .SetProperty(item => item.AttemptCount, item => item.AttemptCount + 1)
                    .SetProperty(item => item.LeaseUntil, now.Add(Lease)), ct);
            if (claimed == 1)
                return await database.OrderEmailDeliveries.SingleAsync(item => item.Id == id, ct);
            database.ChangeTracker.Clear();
        }
        return null;
    }

    private async Task DeliverAsync(IServiceProvider services, WhitePlateDbContext database,
        OrderEmailDelivery delivery, CancellationToken ct)
    {
        var order = await database.Orders.Include(item => item.Lines).ThenInclude(line => line.Options)
            .SingleOrDefaultAsync(item => item.Id == delivery.OrderId && item.TenantId == delivery.TenantId, ct);
        var tenant = await database.Tenants.SingleOrDefaultAsync(item => item.Id == delivery.TenantId, ct);
        if (order is null || tenant is null || delivery.RecipientEmail is null)
        {
            delivery.Discard("order_closed_or_expired");
            await database.SaveChangesAsync(ct);
            return;
        }

        try
        {
            var tracking = services.GetRequiredService<IEmailTrackingCapability>();
            if (delivery.SubjectSnapshot is null || delivery.HtmlSnapshot is null || delivery.TextSnapshot is null)
            {
                var firstRender = OrderEmailRenderer.Render(order, tenant, delivery, tracking, configuration);
                delivery.SavePayloadSnapshot(firstRender.Subject,
                    OrderEmailRenderer.HideTrackingToken(firstRender.Html, firstRender.TrackingToken),
                    OrderEmailRenderer.HideTrackingToken(firstRender.Text, firstRender.TrackingToken));
                await database.SaveChangesAsync(ct);
            }
            var rendered = OrderEmailRenderer.RestoreSnapshot(order, tenant, delivery, tracking);
            var sender = services.GetRequiredService<ResendOrderEmailSender>();
            var providerId = await sender.SendAsync(delivery.Id, delivery.RecipientEmail!, rendered.Subject,
                rendered.Html, rendered.Text, ct);
            delivery.MarkAccepted(providerId, timeProvider.GetUtcNow());
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            var retryAt = timeProvider.GetUtcNow().AddSeconds(Math.Min(300, 1 << Math.Min(delivery.AttemptCount, 8)));
            delivery.ScheduleRetry(retryAt, GetFailureCode(exception));
            logger.LogWarning("Order email event {EventId} failed ({ExceptionType}); retry state is {Status}.",
                delivery.Id, exception.GetType().Name, delivery.Status);
        }

        await database.SaveChangesAsync(ct);
    }

    private static string GetFailureCode(Exception exception) => exception is HttpRequestException request
        ? $"resend_http_{(int?)request.StatusCode ?? 0}"
        : "provider_unavailable";

    private static async Task Delay(TimeSpan duration, CancellationToken ct)
    {
        try { await Task.Delay(duration, ct); }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { }
    }
}
