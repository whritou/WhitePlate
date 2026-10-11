using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Infrastructure;

public sealed class CatalogPersistenceTests
{
    [Fact]
    public async Task ProductSkuIsUniqueWithinRestaurantAndMayRepeatAcrossRestaurants()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Acme");
        database.Organizations.Add(organization);
        var firstTenant = Tenant.Create(organization.Id, "First", "first", "EUR");
        var secondTenant = Tenant.Create(organization.Id, "Second", "second", "USD");
        database.Tenants.AddRange(firstTenant, secondTenant);
        var firstCategory = MenuCategory.Create(firstTenant.Id, "Mains", 0);
        var secondCategory = MenuCategory.Create(secondTenant.Id, "Mains", 0);
        database.MenuCategories.AddRange(firstCategory, secondCategory);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var first = Product.Create(firstTenant.Id, firstCategory.Id, "Soup", null, 10m, 10m, 0);
        first.SetMetadata(" soup-01 ", [], [], [], null, null);
        var second = Product.Create(secondTenant.Id, secondCategory.Id, "Soup", null, 10m, 10m, 0);
        second.SetMetadata("SOUP-01", [], [], [], null, null);
        database.Products.AddRange(first, second);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var duplicate = Product.Create(firstTenant.Id, firstCategory.Id, "Another soup", null, 10m, 10m, 1);
        duplicate.SetMetadata("soup-01", [], [], [], null, null);
        database.Products.Add(duplicate);

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync(TestContext.Current.CancellationToken));
        Assert.Equal("SOUP-01", await database.Products.AsNoTracking()
            .Where(product => product.Id == first.Id).Select(product => product.Sku)
            .SingleAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task TenantCompositeKeysRejectProductsLinkedToAnotherRestaurantsCategory()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Acme");
        database.Organizations.Add(organization);
        var firstTenant = Tenant.Create(organization.Id, "First", "first", "EUR");
        var secondTenant = Tenant.Create(organization.Id, "Second", "second", "USD");
        database.Tenants.AddRange(firstTenant, secondTenant);
        var category = MenuCategory.Create(firstTenant.Id, "Mains", 0);
        database.MenuCategories.Add(category);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        database.Products.Add(Product.Create(secondTenant.Id, category.Id, "Foreign dish", null, 10m, 10m, 0));

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync(TestContext.Current.CancellationToken));
    }
}
