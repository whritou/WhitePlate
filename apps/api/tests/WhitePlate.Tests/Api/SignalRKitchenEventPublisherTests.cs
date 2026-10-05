using Microsoft.AspNetCore.SignalR;
using WhitePlate.Api.Realtime;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Api;

public sealed class SignalRKitchenEventPublisherTests
{
    private static readonly ExternalIdentity Identity = ExternalIdentity.Create("https://identity.example.test/", "staff");

    [Fact]
    public async Task RevokedSubscriptionIsRemovedBeforeAnotherEventCanBeSent()
    {
        var tenant = Guid.NewGuid();
        var otherTenant = Guid.NewGuid();
        var subscriptions = new KitchenSubscriptions();
        subscriptions.Join(tenant, "kitchen", Identity, CancellationToken.None);
        subscriptions.Join(otherTenant, "other", Identity, CancellationToken.None);
        var allowed = true;
        var hub = new RecordingHub();
        var publisher = new SignalRKitchenEventPublisher(hub, subscriptions,
            new KitchenSubscriptionAccess(new Memberships(() => allowed)));
        await publisher.PublishAsync(Message(tenant), TestContext.Current.CancellationToken);

        allowed = false;
        await publisher.PublishAsync(Message(tenant), TestContext.Current.CancellationToken);

        Assert.Equal("kitchen", Assert.Single(hub.Recipients));
        Assert.Equal(("kitchen", KitchenHub.GroupName(tenant)), Assert.Single(hub.Removed));
        Assert.Empty(subscriptions.ForRestaurant(tenant));
        Assert.Single(subscriptions.ForRestaurant(otherTenant));
    }

    [Fact]
    public async Task AuthorizationFailureSendsNothingAndPreservesSubscriptionForRetry()
    {
        var tenant = Guid.NewGuid();
        var subscriptions = new KitchenSubscriptions();
        subscriptions.Join(tenant, "kitchen", Identity, CancellationToken.None);
        var hub = new RecordingHub();
        var publisher = new SignalRKitchenEventPublisher(hub, subscriptions,
            new KitchenSubscriptionAccess(new Memberships(() => throw new InvalidOperationException())));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            publisher.PublishAsync(Message(tenant), TestContext.Current.CancellationToken));

        Assert.Empty(hub.Recipients);
        Assert.Single(subscriptions.ForRestaurant(tenant));
    }

    [Fact]
    public async Task LeavingDuringAuthorizationDoesNotDeliverToTheCapturedConnection()
    {
        var tenant = Guid.NewGuid();
        var subscriptions = new KitchenSubscriptions();
        subscriptions.Join(tenant, "kitchen", Identity, CancellationToken.None);
        var hub = new RecordingHub();
        var publisher = new SignalRKitchenEventPublisher(hub, subscriptions,
            new KitchenSubscriptionAccess(new Memberships(() =>
            {
                subscriptions.Leave(tenant, "kitchen");
                return true;
            })));

        await publisher.PublishAsync(Message(tenant), TestContext.Current.CancellationToken);

        Assert.Empty(hub.Recipients);
    }

    private static KitchenOrderEvent Message(Guid tenant) => new(Guid.NewGuid(), tenant, Guid.NewGuid(),
        "order.created", "Pending", 1, DateTimeOffset.UtcNow);

    private sealed class Memberships(Func<bool> authorize) : IStaffMembershipRepository
    {
        public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity,
            CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity identity,
            CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity identity, RestaurantRole role,
            CancellationToken cancellationToken) => Task.FromResult(role == RestaurantRole.Kitchen && authorize());
    }

    private sealed class RecordingHub : IHubContext<KitchenHub>, IHubClients, IGroupManager
    {
        public List<string> Recipients { get; } = [];
        public List<(string ConnectionId, string Group)> Removed { get; } = [];
        IHubClients IHubContext<KitchenHub>.Clients => this;
        IGroupManager IHubContext<KitchenHub>.Groups => this;
        public IClientProxy All => throw new NotSupportedException();
        public ISingleClientProxy Client(string connectionId) => new RecordingClient(connectionId, Recipients);
        IClientProxy IHubClients<IClientProxy>.Client(string connectionId) => Client(connectionId);
        public IClientProxy AllExcept(IReadOnlyList<string> excludedConnectionIds) => throw new NotSupportedException();
        public IClientProxy Clients(IReadOnlyList<string> connectionIds) => throw new NotSupportedException();
        public IClientProxy Group(string groupName) => throw new NotSupportedException();
        public IClientProxy Groups(IReadOnlyList<string> groupNames) => throw new NotSupportedException();
        public IClientProxy GroupExcept(string groupName, IReadOnlyList<string> excludedConnectionIds) => throw new NotSupportedException();
        public IClientProxy User(string userId) => throw new NotSupportedException();
        public IClientProxy Users(IReadOnlyList<string> userIds) => throw new NotSupportedException();
        public Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken)
        {
            Removed.Add((connectionId, groupName));
            return Task.CompletedTask;
        }
    }

    private sealed class RecordingClient(string connectionId, List<string> recipients) : ISingleClientProxy
    {
        public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken)
        {
            Assert.Equal("order.changed", method);
            Assert.IsType<KitchenOrderEvent>(Assert.Single(args));
            recipients.Add(connectionId);
            return Task.CompletedTask;
        }
        public Task<T> InvokeCoreAsync<T>(string method, object?[] args, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }
}
