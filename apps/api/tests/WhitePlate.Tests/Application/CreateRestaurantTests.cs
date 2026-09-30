using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class CreateRestaurantTests
{
    [Fact]
    public async Task CreatesRestaurantOnlyForItsOwningOrganization()
    {
        var organizationId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");
        var tenants = new TenantRepositoryStub();
        var memberships = new StaffMembershipRepositoryStub(organizationId, identity);
        var handler = new CreateRestaurantCommandHandler(memberships, tenants);

        var created = await handler.HandleAsync(new CreateRestaurantCommand(organizationId, " Bistro ", " BISTRO ", " eur ", identity),
            TestContext.Current.CancellationToken);

        Assert.True(created.IsSuccess);
        Assert.Equal(organizationId, created.Value.OrganizationId);
        Assert.Equal("Bistro", created.Value.Name);
        Assert.Equal("bistro", created.Value.Subdomain);
        Assert.Equal("EUR", created.Value.Currency);
        Assert.Equal(1, tenants.Writes);
    }

    [Fact]
    public async Task RejectsOrganizationIdNotOwnedByTheCallerBeforePersistence()
    {
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");
        var tenants = new TenantRepositoryStub();
        var handler = new CreateRestaurantCommandHandler(new StaffMembershipRepositoryStub(Guid.NewGuid(), identity), tenants);

        var result = await handler.HandleAsync(new CreateRestaurantCommand(Guid.NewGuid(), "Bistro", "bistro", "EUR", identity),
            TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
        Assert.Equal(0, tenants.Writes);
    }

    private sealed class TenantRepositoryStub : ITenantRepository
    {
        public int Writes { get; private set; }

        public Task<Tenant?> FindActiveBySubdomainAsync(TenantSubdomain subdomain, CancellationToken cancellationToken) =>
            Task.FromResult<Tenant?>(null);

        public Task<bool> TryAddAsync(Tenant tenant, CancellationToken cancellationToken)
        {
            Writes++;
            return Task.FromResult(true);
        }
    }

    private sealed class StaffMembershipRepositoryStub(Guid organizationId, ExternalIdentity identity) : IStaffMembershipRepository
    {
        public Task<bool> IsOrganizationOwnerAsync(Guid candidateOrganizationId, ExternalIdentity candidateIdentity,
            CancellationToken cancellationToken) => Task.FromResult(candidateOrganizationId == organizationId && candidateIdentity == identity);

        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity candidateIdentity,
            CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity candidateIdentity, RestaurantRole role,
            CancellationToken cancellationToken) => Task.FromResult(false);
    }
}
