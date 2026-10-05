using Microsoft.AspNetCore.SignalR;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Realtime;

public sealed class SignalRKitchenEventPublisher(IHubContext<KitchenHub> hub, KitchenSubscriptions subscriptions,
    KitchenSubscriptionAccess access) : IOrderEventPublisher
{
    public async Task PublishAsync(KitchenOrderEvent message, CancellationToken cancellationToken)
    {
        foreach (var subscription in subscriptions.ForRestaurant(message.TenantId))
        {
            if (!subscriptions.IsCurrent(subscription)) continue;
            if (!await access.CanJoinAsync(message.TenantId, subscription.Identity, cancellationToken))
            {
                subscriptions.Leave(message.TenantId, subscription.ConnectionId);
                await hub.Groups.RemoveFromGroupAsync(subscription.ConnectionId, KitchenHub.GroupName(message.TenantId),
                    cancellationToken);
                continue;
            }

            // A leave/disconnect may have happened while the database authorization check was running.
            if (subscriptions.IsCurrent(subscription))
                await hub.Clients.Client(subscription.ConnectionId).SendAsync("order.changed", message, cancellationToken);
        }
    }
}
