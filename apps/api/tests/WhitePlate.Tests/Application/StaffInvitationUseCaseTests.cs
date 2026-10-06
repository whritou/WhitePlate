using WhitePlate.Application.Identity;
using WhitePlate.Application.Staff;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class StaffInvitationUseCaseTests
{
    [Fact]
    public async Task CreatesInvitationWithOpaqueTokenOnlyForOwnedRestaurant()
    {
        var organizationId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner", "owner@example.test", true);
        var repository = new InvitationRepositoryStub(organizationId, tenantId);
        var handler = new CreateStaffInvitationCommandHandler(
            new MembershipRepositoryStub(organizationId, identity), repository,
            new FixedTimeProvider(DateTimeOffset.Parse("2026-09-29T10:00:00Z")));

        var result = await handler.HandleAsync(new CreateStaffInvitationCommand(organizationId, tenantId,
            "kitchen@example.test", InvitationRole.KitchenStaff, identity), TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal(64, result.Value.Token.Length);
        Assert.Equal(64, repository.Invitation!.TokenHash.Length);
        Assert.NotEqual(result.Value.Token, repository.Invitation.TokenHash);
        Assert.Equal(DateTimeOffset.Parse("2026-10-06T10:00:00Z"), result.Value.ExpiresAt);
        Assert.Equal(1, repository.Writes);
    }

    [Fact]
    public async Task DoesNotCreateInvitationForAnUnownedRestaurant()
    {
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner", "owner@example.test", true);
        var repository = new InvitationRepositoryStub(Guid.NewGuid(), Guid.NewGuid());
        var handler = new CreateStaffInvitationCommandHandler(
            new MembershipRepositoryStub(Guid.NewGuid(), identity), repository, TimeProvider.System);

        var result = await handler.HandleAsync(new CreateStaffInvitationCommand(Guid.NewGuid(), Guid.NewGuid(),
            "kitchen@example.test", InvitationRole.KitchenStaff, identity), TestContext.Current.CancellationToken);

        Assert.Equal(0, repository.Writes);
        Assert.False(result.IsSuccess);
    }

    private sealed class FixedTimeProvider(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }

    private sealed class MembershipRepositoryStub(Guid organizationId, ExternalIdentity identity) : IStaffMembershipRepository
    {
        public Task<bool> IsOrganizationOwnerAsync(Guid candidateOrganizationId, ExternalIdentity candidateIdentity,
            CancellationToken cancellationToken) => Task.FromResult(candidateOrganizationId == organizationId && candidateIdentity == identity);

        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity candidateIdentity,
            CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity candidateIdentity, RestaurantRole role,
            CancellationToken cancellationToken) => Task.FromResult(false);
    }

    private sealed class InvitationRepositoryStub(Guid organizationId, Guid tenantId) : IStaffInvitationRepository
    {
        public StaffInvitation? Invitation { get; private set; }
        public int Writes { get; private set; }

        public Task<bool> TenantBelongsToOrganizationAsync(Guid candidateOrganizationId, Guid candidateTenantId,
            CancellationToken cancellationToken) => Task.FromResult(candidateOrganizationId == organizationId && candidateTenantId == tenantId);

        public Task AddAsync(StaffInvitation invitation, CancellationToken cancellationToken)
        {
            Writes++;
            Invitation = invitation;
            return Task.CompletedTask;
        }

        public Task<bool> AcceptAsync(string tokenHash, ExternalIdentity identity, DateTimeOffset now,
            CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> RevokeAsync(Guid organizationId, Guid invitationId, ExternalIdentity identity,
            DateTimeOffset now, CancellationToken cancellationToken) => Task.FromResult(false);
    }
}
