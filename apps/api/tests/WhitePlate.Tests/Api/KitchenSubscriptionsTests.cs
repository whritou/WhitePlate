using WhitePlate.Api.Realtime;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Tests.Api;

public sealed class KitchenSubscriptionsTests
{
    private static readonly ExternalIdentity Identity = ExternalIdentity.Create("https://identity.example.test/", "staff");

    [Fact]
    public void DisconnectRemovesAllRestaurantsForOnlyThatConnection()
    {
        var subscriptions = new KitchenSubscriptions();
        var tenant = Guid.NewGuid();
        subscriptions.Join(tenant, "first", Identity, CancellationToken.None);
        subscriptions.Join(Guid.NewGuid(), "first", Identity, CancellationToken.None);
        subscriptions.Join(tenant, "second", Identity, CancellationToken.None);

        subscriptions.Disconnect("first");

        Assert.Equal("second", Assert.Single(subscriptions.ForRestaurant(tenant)).ConnectionId);
    }

    [Fact]
    public void LeaveAndRejoinInvalidatePreviouslyCapturedDeliveryRecipients()
    {
        var subscriptions = new KitchenSubscriptions();
        var tenant = Guid.NewGuid();
        subscriptions.Join(tenant, "connection", Identity, CancellationToken.None);
        var previous = Assert.Single(subscriptions.ForRestaurant(tenant));

        subscriptions.Leave(tenant, "connection");
        Assert.False(subscriptions.IsCurrent(previous));
        subscriptions.Join(tenant, "connection", Identity, CancellationToken.None);

        Assert.False(subscriptions.IsCurrent(previous));
        Assert.True(subscriptions.IsCurrent(Assert.Single(subscriptions.ForRestaurant(tenant))));
    }

    [Fact]
    public void AbortedConnectionCannotReceiveWhileDisconnectCleanupIsPending()
    {
        using var disconnected = new CancellationTokenSource();
        var subscriptions = new KitchenSubscriptions();
        var tenant = Guid.NewGuid();
        subscriptions.Join(tenant, "connection", Identity, disconnected.Token);
        var recipient = Assert.Single(subscriptions.ForRestaurant(tenant));

        disconnected.Cancel();

        Assert.False(subscriptions.IsCurrent(recipient));
    }
}
