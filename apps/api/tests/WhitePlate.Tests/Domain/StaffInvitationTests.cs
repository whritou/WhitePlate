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
            "Kitchen@Example.test", new string('a', 64), now.AddDays(7), now);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "kitchen-1", "kitchen@example.test", true);

        Assert.True(invitation.TryAccept(identity, now.AddMinutes(1)));
        Assert.False(invitation.TryAccept(identity, now.AddMinutes(2)));
        Assert.Equal(identity.Subject, invitation.AcceptedSubject);
    }

    [Fact]
    public void RevokedAndExpiredInvitationsCannotBeAccepted()
    {
        var now = DateTimeOffset.Parse("2026-09-29T10:00:00Z");
        var revoked = StaffInvitation.Create(Guid.NewGuid(), null, InvitationRole.OrganizationOwner,
            "owner@example.test", new string('a', 64), now.AddDays(7), now);
        Assert.True(revoked.TryRevoke(now));
        var expired = StaffInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), InvitationRole.RestaurantManager,
            "manager@example.test", new string('b', 64), now.AddDays(1), now);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "manager-1", "manager@example.test", true);

        Assert.False(revoked.TryAccept(identity, now));
        Assert.False(expired.TryAccept(identity, now.AddDays(1)));
    }

    [Fact]
    public void RevokeIsAllowedOnlyWhileAnInvitationIsPending()
    {
        var now = DateTimeOffset.Parse("2026-09-29T10:00:00Z");
        var pending = StaffInvitation.Create(Guid.NewGuid(), null, InvitationRole.OrganizationOwner,
            "owner@example.test", new string('a', 64), now.AddDays(1), now);
        var expired = StaffInvitation.Create(Guid.NewGuid(), null, InvitationRole.OrganizationOwner,
            "expired@example.test", new string('b', 64), now.AddDays(1), now);
        var accepted = StaffInvitation.Create(Guid.NewGuid(), null, InvitationRole.OrganizationOwner,
            "accepted@example.test", new string('c', 64), now.AddDays(1), now);
        Assert.True(accepted.TryAccept(ExternalIdentity.Create("https://identity.example.test/", "accepted",
            "accepted@example.test", true), now));

        Assert.True(pending.TryRevoke(now));
        Assert.False(pending.TryRevoke(now));
        Assert.False(expired.TryRevoke(now.AddDays(1)));
        Assert.False(accepted.TryRevoke(now));
    }

    [Fact]
    public void RequiresMatchingOrganizationOrRestaurantScope()
    {
        var now = DateTimeOffset.UtcNow;
        Assert.Throws<DomainRuleException>(() => StaffInvitation.Create(Guid.NewGuid(), Guid.NewGuid(),
            InvitationRole.OrganizationOwner, "owner@example.test", new string('a', 64), now.AddDays(1), now));
        Assert.Throws<DomainRuleException>(() => StaffInvitation.Create(Guid.NewGuid(), null,
            InvitationRole.KitchenStaff, "kitchen@example.test", new string('a', 64), now.AddDays(1), now));
    }

    [Fact]
    public void InvitationRequiresVerifiedEmailThatMatchesTheRecipient()
    {
        var now = DateTimeOffset.UtcNow;
        var invitation = StaffInvitation.Create(Guid.NewGuid(), Guid.NewGuid(), InvitationRole.KitchenStaff,
            "invited@example.test", new string('c', 64), now.AddDays(1), now);

        Assert.False(invitation.TryAccept(ExternalIdentity.Create("https://identity.example.test/", "a",
            "other@example.test", true), now));
        Assert.False(invitation.TryAccept(ExternalIdentity.Create("https://identity.example.test/", "b",
            "invited@example.test", false), now));
        Assert.True(invitation.TryAccept(ExternalIdentity.Create("https://identity.example.test/", "c",
            "INVITED@example.test", true), now));
    }
}
