using WhitePlate.Domain.Common;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Domain;

public sealed class OrganizationRoleGrantTests
{
    [Fact]
    public void CreatesAndUpdatesAValidatedGrantSetWithOptimisticVersioning()
    {
        var organizationId = Guid.NewGuid();
        var grant = OrganizationRoleGrantSet.Create(organizationId, RestaurantRole.Kitchen,
            [RestaurantPermissionCatalog.KitchenDisplay]);

        Assert.Equal(organizationId, grant.OrganizationId);
        Assert.Equal(1, grant.Version);
        Assert.True(grant.Has(RestaurantPermission.KitchenDisplay));
        Assert.False(grant.Has(RestaurantPermission.AnalyticsView));

        grant.Replace([RestaurantPermissionCatalog.KitchenDisplay, RestaurantPermissionCatalog.OrdersManage], 1);

        Assert.Equal(2, grant.Version);
        Assert.True(grant.Has(RestaurantPermission.OrdersManage));
        Assert.Throws<DomainRuleException>(() => grant.Replace([], 1));
    }

    [Theory]
    [InlineData(RestaurantRole.Manager, "orders.manage", true)]
    [InlineData(RestaurantRole.Manager, "billing.manage", false)]
    [InlineData(RestaurantRole.Staff, "orders.manage", true)]
    [InlineData(RestaurantRole.Staff, "analytics.view", false)]
    [InlineData(RestaurantRole.Kitchen, "kitchen.display", true)]
    [InlineData(RestaurantRole.Kitchen, "orders.manage", false)]
    [InlineData(RestaurantRole.Accountant, "analytics.view", true)]
    [InlineData(RestaurantRole.Accountant, "billing.manage", true)]
    public void DefaultsMatchTheApprovedMatrix(RestaurantRole role, string key, bool granted)
    {
        var defaults = OrganizationRoleGrantSet.CreateDefault(Guid.NewGuid(), role);
        Assert.Equal(granted, defaults.PermissionKeys.Contains(key));
    }

    [Fact]
    public void RejectsOwnerRoleAndUnknownPermissions()
    {
        Assert.Throws<DomainRuleException>(() => OrganizationRoleGrantSet.Create(Guid.NewGuid(), RestaurantRole.Manager,
            ["invented.permission"]));
        Assert.Throws<DomainRuleException>(() => OrganizationRoleGrantSet.Create(Guid.NewGuid(), (RestaurantRole)99, []));
    }
}
