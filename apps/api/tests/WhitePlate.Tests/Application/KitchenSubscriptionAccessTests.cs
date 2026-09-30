using WhitePlate.Application.Identity;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class KitchenSubscriptionAccessTests
{
    [Theory]
    [InlineData(RestaurantRole.Manager)]
    [InlineData(RestaurantRole.Kitchen)]
    public async Task RestaurantStaffCanJoinOnlyRestaurantsWhereTheyAreMembers(RestaurantRole role)
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "staff");
        var memberships = new FakeMemberships();
        memberships.Roles.Add((tenantId, identity.Subject, role));
        var access = new KitchenSubscriptionAccess(memberships);

        Assert.True(await access.CanJoinAsync(tenantId, identity, TestContext.Current.CancellationToken));
        Assert.False(await access.CanJoinAsync(Guid.NewGuid(), identity, TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task OrganizationOwnerCanJoinItsRestaurantWithoutRestaurantMembership()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");
        var memberships = new FakeMemberships();
        memberships.Owners.Add((tenantId, identity.Subject));

        Assert.True(await new KitchenSubscriptionAccess(memberships)
            .CanJoinAsync(tenantId, identity, TestContext.Current.CancellationToken));
    }

    private sealed class FakeMemberships : IStaffMembershipRepository
    {
        public HashSet<(Guid TenantId, string Subject, RestaurantRole Role)> Roles { get; } = [];
        public HashSet<(Guid TenantId, string Subject)> Owners { get; } = [];

        public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity,
            CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity identity,
            CancellationToken cancellationToken) => Task.FromResult(Owners.Contains((tenantId, identity.Subject)));

        public Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity identity, RestaurantRole role,
            CancellationToken cancellationToken) => Task.FromResult(Roles.Contains((tenantId, identity.Subject, role)));
    }
}
