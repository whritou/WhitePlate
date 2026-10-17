using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Organizations;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class OrganizationRolePermissionsHandlerTests
{
    [Fact]
    public async Task OwnerReadsAndChangesPersistedRoleGrantsButCannotEditOwner()
    {
        var organizationId = Guid.NewGuid();
        var owner = ExternalIdentity.Create("https://id.example.test/", "owner");
        var membership = new Memberships(organizationId, owner);
        var repository = new RoleGrants(organizationId);
        var handler = new OrganizationRolePermissionsHandler(membership, repository);

        var initial = await handler.GetAsync(organizationId, owner, TestContext.Current.CancellationToken);
        Assert.True(initial.IsSuccess);
        Assert.Equal(5, initial.Value.Count);
        Assert.True(initial.Value[0].IsProtected);
        Assert.Equal(RestaurantPermissionCatalog.Keys, initial.Value[0].Permissions);

        var updated = await handler.ReplaceAsync(organizationId, "Kitchen",
            [RestaurantPermissionCatalog.KitchenDisplay, RestaurantPermissionCatalog.OrdersManage], 1,
            owner, TestContext.Current.CancellationToken);
        Assert.True(updated.IsSuccess);
        Assert.Equal(2, updated.Value.Version);
        Assert.Contains(RestaurantPermissionCatalog.OrdersManage, updated.Value.Permissions);
        Assert.Equal(1, repository.Saves);

        var ownerEdit = await handler.ReplaceAsync(organizationId, "OrganizationOwner", [], 1, owner,
            TestContext.Current.CancellationToken);
        Assert.False(ownerEdit.IsSuccess);
        Assert.Equal(ErrorCode.ValidationFailed, ownerEdit.Error.Code);
    }

    [Fact]
    public async Task NonOwnerCannotReadOrChangeRoleGrants()
    {
        var organizationId = Guid.NewGuid();
        var nonOwner = ExternalIdentity.Create("https://id.example.test/", "staff");
        var handler = new OrganizationRolePermissionsHandler(new Memberships(organizationId,
            ExternalIdentity.Create("https://id.example.test/", "owner")), new RoleGrants(organizationId));

        var read = await handler.GetAsync(organizationId, nonOwner, TestContext.Current.CancellationToken);
        var write = await handler.ReplaceAsync(organizationId, "Manager", [], 1, nonOwner,
            TestContext.Current.CancellationToken);

        Assert.False(read.IsSuccess);
        Assert.Equal(ErrorCode.NotFound, read.Error.Code);
        Assert.False(write.IsSuccess);
        Assert.Equal(ErrorCode.NotFound, write.Error.Code);
    }

    private sealed class Memberships(Guid organizationId, ExternalIdentity owner) : IStaffMembershipRepository
    {
        public Task<bool> IsOrganizationOwnerAsync(Guid candidateOrganization, ExternalIdentity identity,
            CancellationToken cancellationToken) => Task.FromResult(candidateOrganization == organizationId && identity == owner);
        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity identity,
            CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity identity, RestaurantRole role,
            CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> HasPermissionAsync(Guid tenantId, ExternalIdentity identity,
            RestaurantPermission permission, CancellationToken cancellationToken) => Task.FromResult(false);
    }

    private sealed class RoleGrants : IOrganizationRoleGrantRepository
    {
        private readonly Dictionary<RestaurantRole, OrganizationRoleGrantSet> grants;
        public int Saves { get; private set; }

        public RoleGrants(Guid organizationId) => grants = Enum.GetValues<RestaurantRole>()
            .ToDictionary(role => role, role => OrganizationRoleGrantSet.CreateDefault(organizationId, role));

        public Task<IReadOnlyList<OrganizationRoleGrantSet>> ListAsync(Guid organizationId,
            CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<OrganizationRoleGrantSet>>(
            grants.Values.OrderBy(item => item.Role).ToArray());

        public Task<OrganizationRoleGrantSet?> GetAsync(Guid organizationId, RestaurantRole role,
            CancellationToken cancellationToken) => Task.FromResult(grants.GetValueOrDefault(role));

        public Task<bool> SaveAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken)
        {
            Saves++;
            return Task.FromResult(true);
        }
    }
}
