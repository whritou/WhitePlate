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
