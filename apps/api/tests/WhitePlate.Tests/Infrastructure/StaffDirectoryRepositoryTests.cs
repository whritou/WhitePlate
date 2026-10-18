using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class StaffDirectoryRepositoryTests
{
    [Fact]
    public async Task ReturnsEachCustomMembershipWithItsOwnRolePermissions()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Directory organization");
        var restaurant = Tenant.Create(organization.Id, "Bistro", "directory-bistro", "EUR");
        var kitchenIdentity = ExternalIdentity.Create("https://id.example.test/", "directory-kitchen");
        var ordersIdentity = ExternalIdentity.Create("https://id.example.test/", "directory-orders");
        var kitchenRole = OrganizationRoleGrantSet.CreateCustom(organization.Id, "Prep team",
            [RestaurantPermissionCatalog.KitchenDisplay]);
        var ordersRole = OrganizationRoleGrantSet.CreateCustom(organization.Id, "Order team",
            [RestaurantPermissionCatalog.OrdersManage]);
        database.Organizations.Add(organization);
        database.Tenants.Add(restaurant);
        database.OrganizationRoleGrants.AddRange(kitchenRole, ordersRole);
        database.RestaurantMemberships.AddRange(
            RestaurantMembership.Create(organization.Id, restaurant.Id, kitchenIdentity, kitchenRole.RoleId,
                RestaurantRole.Staff),
            RestaurantMembership.Create(organization.Id, restaurant.Id, ordersIdentity, ordersRole.RoleId,
                RestaurantRole.Staff));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        var repository = new StaffDirectoryRepository(database);

        var kitchen = await repository.GetAsync(kitchenIdentity, TestContext.Current.CancellationToken);
        var orders = await repository.GetAsync(ordersIdentity, TestContext.Current.CancellationToken);

        Assert.Equal([RestaurantPermissionCatalog.KitchenDisplay], kitchen.Restaurants.Single().Permissions);
        Assert.Equal([RestaurantPermissionCatalog.OrdersManage], orders.Restaurants.Single().Permissions);
    }
}
