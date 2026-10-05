using WhitePlate.Domain.Identity;

namespace WhitePlate.Api.Realtime;

// Matches the current single-instance, in-memory SignalR host. Never cache membership decisions here.
public sealed class KitchenSubscriptions
{
    private readonly object gate = new();
    private readonly Dictionary<(Guid TenantId, string ConnectionId), KitchenSubscription> subscriptions = [];

    public void Join(Guid tenantId, string connectionId, ExternalIdentity identity, CancellationToken disconnected)
    {
        lock (gate)
            subscriptions[(tenantId, connectionId)] = new(tenantId, connectionId, identity, disconnected);
    }

    public void Leave(Guid tenantId, string connectionId)
    {
        lock (gate) subscriptions.Remove((tenantId, connectionId));
    }

    public void Disconnect(string connectionId)
    {
        lock (gate)
        {
            foreach (var key in subscriptions.Keys.Where(key => key.ConnectionId == connectionId).ToArray())
                subscriptions.Remove(key);
        }
    }

    public KitchenSubscription[] ForRestaurant(Guid tenantId)
    {
        lock (gate)
            return subscriptions.Values.Where(subscription => subscription.TenantId == tenantId).ToArray();
    }

    public bool IsCurrent(KitchenSubscription subscription)
    {
        lock (gate)
            return !subscription.Disconnected.IsCancellationRequested &&
                subscriptions.TryGetValue((subscription.TenantId, subscription.ConnectionId), out var current) &&
                ReferenceEquals(subscription, current);
    }
}

public sealed record KitchenSubscription(Guid TenantId, string ConnectionId, ExternalIdentity Identity,
    CancellationToken Disconnected);
