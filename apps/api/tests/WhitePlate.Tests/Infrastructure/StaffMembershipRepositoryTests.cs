using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class StaffMembershipRepositoryTests
{
    [Fact]
    public async Task ResolvesCustomMembershipPermissionsByRoleIdInsteadOfCompatibilityRole()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);

        var organization = Organization.Create("Custom roles");
        var restaurant = Tenant.Create(organization.Id, "Bistro", "custom-bistro", "EUR");
        var identity = ExternalIdentity.Create("https://id.example.test/", "custom-kitchen");
        var ordersIdentity = ExternalIdentity.Create("https://id.example.test/", "custom-orders");
        var customRole = OrganizationRoleGrantSet.CreateCustom(organization.Id, "Prep team",
            [RestaurantPermissionCatalog.KitchenDisplay]);
        var ordersRole = OrganizationRoleGrantSet.CreateCustom(organization.Id, "Order team",
            [RestaurantPermissionCatalog.OrdersManage]);
        database.Organizations.Add(organization);
        database.Tenants.Add(restaurant);
        database.OrganizationRoleGrants.AddRange(customRole, ordersRole);
        database.RestaurantMemberships.Add(RestaurantMembership.Create(organization.Id, restaurant.Id,
            identity, customRole.RoleId, RestaurantRole.Staff));
        database.RestaurantMemberships.Add(RestaurantMembership.Create(organization.Id, restaurant.Id,
            ordersIdentity, ordersRole.RoleId, RestaurantRole.Staff));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var repository = new StaffMembershipRepository(database);

        Assert.True(await repository.HasPermissionAsync(restaurant.Id, identity, RestaurantPermission.KitchenDisplay,
            TestContext.Current.CancellationToken));
        Assert.False(await repository.HasPermissionAsync(restaurant.Id, identity, RestaurantPermission.OrdersManage,
            TestContext.Current.CancellationToken));
        Assert.True(await repository.HasPermissionAsync(restaurant.Id, ordersIdentity, RestaurantPermission.OrdersManage,
            TestContext.Current.CancellationToken));
        Assert.False(await repository.HasPermissionAsync(restaurant.Id, ordersIdentity, RestaurantPermission.KitchenDisplay,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ResolvesOwnerAndRestaurantRolesOnlyWithinTheirScopes()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);

        var firstOrganization = Organization.Create("First Organization");
        var secondOrganization = Organization.Create("Second Organization");
        database.Organizations.AddRange(firstOrganization, secondOrganization);
        var firstRestaurant = Tenant.Create(firstOrganization.Id, "First", "first", "EUR");
        var secondRestaurant = Tenant.Create(secondOrganization.Id, "Second", "second", "USD");
        database.Tenants.AddRange(firstRestaurant, secondRestaurant);
        var ownerIdentity = ExternalIdentity.Create("https://id.example.test/", "owner");
        var kitchenIdentity = ExternalIdentity.Create("https://id.example.test/", "kitchen");
        database.OrganizationOwnerMemberships.Add(OrganizationOwnerMembership.Create(firstOrganization.Id, ownerIdentity));
        database.RestaurantMemberships.Add(RestaurantMembership.Create(firstRestaurant.Id, kitchenIdentity, RestaurantRole.Kitchen));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var repository = new StaffMembershipRepository(database);

        Assert.True(await repository.IsOrganizationOwnerAsync(firstOrganization.Id, ownerIdentity, TestContext.Current.CancellationToken));
        Assert.True(await repository.IsOrganizationOwnerOfTenantAsync(firstRestaurant.Id, ownerIdentity, TestContext.Current.CancellationToken));
        Assert.False(await repository.IsOrganizationOwnerOfTenantAsync(secondRestaurant.Id, ownerIdentity, TestContext.Current.CancellationToken));
        Assert.True(await repository.HasRestaurantRoleAsync(firstRestaurant.Id, kitchenIdentity, RestaurantRole.Kitchen, TestContext.Current.CancellationToken));
        Assert.False(await repository.HasRestaurantRoleAsync(firstRestaurant.Id, kitchenIdentity, RestaurantRole.Manager, TestContext.Current.CancellationToken));
        Assert.False(await repository.HasRestaurantRoleAsync(secondRestaurant.Id, kitchenIdentity, RestaurantRole.Kitchen, TestContext.Current.CancellationToken));
    }
}
