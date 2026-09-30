using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Domain;

public sealed class StaffMembershipTests
{
    [Fact]
    public void KeepsTheExternalIssuerAndSubjectAsAnExactIdentityPair()
    {
        var identity = ExternalIdentity.Create("https://identity.example.test/", "staff-123");

        Assert.Equal("https://identity.example.test/", identity.Issuer);
        Assert.Equal("staff-123", identity.Subject);
    }

    [Theory]
    [InlineData("", "staff-123")]
    [InlineData("not a uri", "staff-123")]
    [InlineData("https://identity.example.test/", "")]
    public void RejectsInvalidExternalIdentity(string issuer, string subject) =>
        Assert.Throws<DomainRuleException>(() => ExternalIdentity.Create(issuer, subject));

    [Fact]
    public void OrganizationOwnerIsScopedToOneOrganization()
    {
        var organizationId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "owner-1");

        var membership = OrganizationOwnerMembership.Create(organizationId, identity);

        Assert.Equal(organizationId, membership.OrganizationId);
        Assert.Equal(identity, membership.Identity);
    }

    [Fact]
    public void RestaurantMembershipAllowsOnlyManagerOrKitchenRoles()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "staff-1");
        var manager = RestaurantMembership.Create(tenantId, identity, RestaurantRole.Manager);
        var kitchen = RestaurantMembership.Create(tenantId, identity, RestaurantRole.Kitchen);

        Assert.Equal(RestaurantRole.Manager, manager.Role);
        Assert.Equal(RestaurantRole.Kitchen, kitchen.Role);
        Assert.Equal(tenantId, manager.TenantId);
        Assert.Throws<DomainRuleException>(() => RestaurantMembership.Create(tenantId, identity, (RestaurantRole)99));
    }
}
