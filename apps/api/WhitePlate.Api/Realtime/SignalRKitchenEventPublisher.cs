using Microsoft.AspNetCore.SignalR;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Realtime;

public sealed class SignalRKitchenEventPublisher(IHubContext<KitchenHub> hub) : IOrderEventPublisher
{
    public Task PublishAsync(KitchenOrderEvent message, CancellationToken cancellationToken) =>
        hub.Clients.Group(KitchenHub.GroupName(message.TenantId))
            .SendAsync("order.changed", message, cancellationToken);
}
