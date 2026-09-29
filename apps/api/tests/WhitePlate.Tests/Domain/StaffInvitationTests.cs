using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Tests.Domain;

public sealed class StaffInvitationTests
{
    [Fact]
    public void InvitationCanBeAcceptedOnlyOnceBeforeExpiry()
    {
        var now = DateTimeOffset.Parse("2026-09-29T10:00:00Z");
        var invitation = StaffInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), InvitationRole.KitchenStaff,
            new string('a', 64), now.AddDays(7), now);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "kitchen-1");

        Assert.True(invitation.TryAccept(identity, now.AddMinutes(1)));
        Assert.False(invitation.TryAccept(identity, now.AddMinutes(2)));
        Assert.Equal(identity.Subject, invitation.AcceptedSubject);
    }

    [Fact]
    public void RevokedAndExpiredInvitationsCannotBeAccepted()
    {
        var now = DateTimeOffset.Parse("2026-09-29T10:00:00Z");
        var revoked = StaffInvitation.Create(Guid.NewGuid(), null, InvitationRole.OrganizationOwner,
            new string('a', 64), now.AddDays(7), now);
        revoked.Revoke();
        var expired = StaffInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), InvitationRole.RestaurantManager,
            new string('b', 64), now.AddDays(1), now);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "manager-1");

        Assert.False(revoked.TryAccept(identity, now));
        Assert.False(expired.TryAccept(identity, now.AddDays(1)));
    }

    [Fact]
    public void RequiresMatchingOrganizationOrRestaurantScope()
    {
        var now = DateTimeOffset.UtcNow;
        Assert.Throws<DomainRuleException>(() => StaffInvitation.Create(Guid.NewGuid(), Guid.NewGuid(),
            InvitationRole.OrganizationOwner, new string('a', 64), now.AddDays(1), now));
        Assert.Throws<DomainRuleException>(() => StaffInvitation.Create(Guid.NewGuid(), null,
            InvitationRole.KitchenStaff, new string('a', 64), now.AddDays(1), now));
    }
}
