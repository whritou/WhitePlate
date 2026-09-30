using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Staff;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class RevokeStaffInvitationTests
{
    [Fact]
    public async Task HidesInvitationsTheCallerCannotRevoke()
    {
        var repository = new InvitationRepositoryStub();
        var handler = new RevokeStaffInvitationCommandHandler(repository);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");

        var result = await handler.HandleAsync(Guid.NewGuid(), Guid.NewGuid(), identity,
            TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
        Assert.Equal(1, repository.Calls);
    }

    private sealed class InvitationRepositoryStub : IStaffInvitationRepository
    {
        public int Calls { get; private set; }
        public Task<bool> TenantBelongsToOrganizationAsync(Guid organizationId, Guid tenantId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task AddAsync(StaffInvitation invitation, CancellationToken cancellationToken) => Task.CompletedTask;
        public Task<bool> AcceptAsync(string tokenHash, ExternalIdentity identity, DateTimeOffset now, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> RevokeAsync(Guid organizationId, Guid invitationId, ExternalIdentity identity, CancellationToken cancellationToken)
        {
            Calls++;
            return Task.FromResult(false);
        }
    }
}
