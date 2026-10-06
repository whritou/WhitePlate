using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Organizations;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Identity;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class RenameOrganizationTests
{
    [Fact]
    public async Task RenamesOnlyAnOrganizationTheCallerOwns()
    {
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");
        var organization = Organization.Create("Old Name");
        var repository = new OrganizationRepositoryStub(organization);
        var handler = new RenameOrganizationCommandHandler(repository);

        var result = await handler.HandleAsync(organization.Id, " New Name ", identity, TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("New Name", result.Value.Name);
        Assert.Equal(1, repository.Saves);
    }

    [Fact]
    public async Task DoesNotRevealOrganizationOutsideTheCallersMembership()
    {
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");
        var handler = new RenameOrganizationCommandHandler(new OrganizationRepositoryStub(null));

        var result = await handler.HandleAsync(Guid.NewGuid(), "New Name", identity, TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
    }

    private sealed class OrganizationRepositoryStub(Organization? organization) : IOrganizationRepository
    {
        public int Saves { get; private set; }
        public Task<IReadOnlyList<OrganizationDto>> ListOwnedAsync(ExternalIdentity identity, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<OrganizationDto>>([]);
        public Task<Organization?> FindOwnedAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken) =>
            Task.FromResult(organization?.Id == organizationId ? organization : null);
        public Task<IReadOnlyList<TenantDto>?> ListRestaurantsOwnedAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<TenantDto>?>([]);
        public Task<IReadOnlyList<OrganizationMemberDto>?> ListMembersOwnedAsync(Guid organizationId,
            ExternalIdentity identity, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<OrganizationMemberDto>?>([]);
        public Task<IReadOnlyList<OrganizationInvitationSummaryDto>?> ListInvitationsOwnedAsync(Guid organizationId,
            ExternalIdentity identity, DateTimeOffset now, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<OrganizationInvitationSummaryDto>?>([]);
        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            Saves++;
            return Task.CompletedTask;
        }
    }
}
