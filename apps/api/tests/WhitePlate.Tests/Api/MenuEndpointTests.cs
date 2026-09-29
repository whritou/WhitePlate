using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Api.Tenancy;

namespace WhitePlate.Tests.Api;

public sealed class MenuEndpointTests
{
    [Fact]
    public async Task PublicMenuReturnsOnlyAvailableDataForTheResolvedTenant()
    {
        using var factory = new MenuFactory();
        await factory.SeedAsync();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("https://bistro.example.test/api/v1/menu", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("EUR", json.RootElement.GetProperty("currency").GetString());
        var category = Assert.Single(json.RootElement.GetProperty("categories").EnumerateArray());
        Assert.Equal("Mains", category.GetProperty("name").GetString());
        var product = Assert.Single(category.GetProperty("products").EnumerateArray());
        Assert.Equal("Soup", product.GetProperty("name").GetString());
        Assert.Equal(8.5m, product.GetProperty("basePrice").GetDecimal());
        var group = Assert.Single(product.GetProperty("optionGroups").EnumerateArray());
        Assert.Equal("Extras", group.GetProperty("name").GetString());
        Assert.Equal("Bread", Assert.Single(group.GetProperty("options").EnumerateArray()).GetProperty("name").GetString());
    }

    private sealed class MenuFactory : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Production");
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.ConfigureServices(services =>
            {
                services.PostConfigure<TenantHostOptions>(options => options.BaseDomain = "example.test");
                services.RemoveAll<DbContextOptions<WhitePlateDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WhitePlateDbContext>>();
                services.AddDbContext<WhitePlateDbContext>(options => options.UseSqlite(connection));
            });
        }

        public async Task SeedAsync()
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
            var organization = Organization.Create("Acme");
            database.Organizations.Add(organization);
            var tenant = Tenant.Create(organization.Id, "Bistro", "bistro", "EUR");
            var otherTenant = Tenant.Create(organization.Id, "Other", "other", "USD");
            database.Tenants.AddRange(tenant, otherTenant);
            var category = MenuCategory.Create(tenant.Id, "Mains", 0);
            var otherCategory = MenuCategory.Create(otherTenant.Id, "Other", 0);
            database.MenuCategories.AddRange(category, otherCategory);
            var product = Product.Create(tenant.Id, category.Id, "Soup", "Seasonal soup", 8.50m, 10m, 0);
            var unavailable = Product.Create(otherTenant.Id, otherCategory.Id, "Hidden", null, 2m, 0m, 0);
            unavailable.SetAvailability(false);
            database.Products.AddRange(product, unavailable);
            var group = ProductOptionGroup.Create(tenant.Id, product.Id, "Extras", 0, 1, 0);
            database.ProductOptionGroups.Add(group);
            database.ProductOptions.Add(ProductOption.Create(tenant.Id, group.Id, "Bread", 1m, 0));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) connection.Dispose();
        }
    }
}
