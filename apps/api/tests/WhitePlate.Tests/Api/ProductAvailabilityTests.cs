using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task KitchenCanReadAndToggleAvailabilityWithoutCatalogDetails()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "kitchen");

        using var response = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/products/availability", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var products = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var soup = Assert.Single(products.RootElement.EnumerateArray());
        Assert.Equal(seeded.ProductId, soup.GetProperty("id").GetGuid());
        Assert.Equal("Soup", soup.GetProperty("name").GetString());
        Assert.True(soup.GetProperty("isAvailable").GetBoolean());
        Assert.False(soup.TryGetProperty("basePrice", out _));
        Assert.False(soup.TryGetProperty("sku", out _));

        using var fullCatalog = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/catalog", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, fullCatalog.StatusCode);

        using var update = await client.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/products/{seeded.ProductId}/availability",
            new { isAvailable = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);

        using var refreshed = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/products/availability", TestContext.Current.CancellationToken);
        using var updatedProducts = JsonDocument.Parse(await refreshed.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.False(Assert.Single(updatedProducts.RootElement.EnumerateArray())
            .GetProperty("isAvailable").GetBoolean());
    }

    [Fact]
    public async Task ProductAvailabilityRequiresCurrentTenantMembershipAndCannotRestoreArchivedProducts()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        await factory.SeedMembershipAsync(seeded.TenantId, "revoked-kitchen", RestaurantRole.Kitchen);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var otherTenantId = await database.Products.Where(item => item.Id == seeded.OtherProductId)
            .Select(item => item.TenantId).SingleAsync(TestContext.Current.CancellationToken);
        await factory.SeedMembershipAsync(otherTenantId, "foreign-kitchen", RestaurantRole.Kitchen);
        database.RestaurantMemberships.RemoveRange(await database.RestaurantMemberships
            .Where(item => item.TenantId == seeded.TenantId && item.Subject == "revoked-kitchen")
            .ToListAsync(TestContext.Current.CancellationToken));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        using var anonymous = factory.CreateClient();
        var path = $"/api/v1/tenants/{seeded.TenantId}/products/{seeded.ProductId}/availability";
        using var unauthenticated = await anonymous.PutAsJsonAsync(path, new { isAvailable = false },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        using var foreignClient = factory.CreateClient();
        foreignClient.DefaultRequestHeaders.Authorization = new("Bearer", "foreign-kitchen");
        using var foreign = await foreignClient.PutAsJsonAsync(path, new { isAvailable = false },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);

        using var revokedClient = factory.CreateClient();
        revokedClient.DefaultRequestHeaders.Authorization = new("Bearer", "revoked-kitchen");
        using var revoked = await revokedClient.PutAsJsonAsync(path, new { isAvailable = false },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, revoked.StatusCode);

        using var managerClient = factory.CreateClient();
        managerClient.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        using var archive = await managerClient.DeleteAsync(
            $"/api/v1/tenants/{seeded.TenantId}/products/{seeded.ProductId}", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);

        using var kitchenClient = factory.CreateClient();
        kitchenClient.DefaultRequestHeaders.Authorization = new("Bearer", "kitchen");
        using var restoreAttempt = await kitchenClient.PutAsJsonAsync(path, new { isAvailable = true },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, restoreAttempt.StatusCode);

        Assert.False(await database.Products.Where(item => item.Id == seeded.ProductId)
            .Select(item => item.IsAvailable).SingleAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ProductAvailabilityRequiresExplicitBoolean()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "kitchen");
        var path = $"/api/v1/tenants/{seeded.TenantId}/products/{seeded.ProductId}/availability";

        using var missing = await client.PutAsJsonAsync(path, new { }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        using var malformed = await client.PutAsJsonAsync(path, new { isAvailable = "false" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
    }

    [Fact]
    public async Task ProductAvailabilityReadAndUpdateAlsoAllowManagerAndOrganizationOwner()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        await factory.SeedOwnerAsync(seeded.OrganizationId, "owner");

        foreach (var subject in new[] { "manager", "owner" })
        {
            using var client = factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new("Bearer", subject);
            using var read = await client.GetAsync(
                $"/api/v1/tenants/{seeded.TenantId}/products/availability", TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.OK, read.StatusCode);
            using var update = await client.PutAsJsonAsync(
                $"/api/v1/tenants/{seeded.TenantId}/products/{seeded.ProductId}/availability",
                new { isAvailable = false }, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        }
    }

    [Fact]
    public async Task HiddenCategoryProductsAreNotListedOrToggledThroughAvailability()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var categoryId = await database.Products.Where(item => item.Id == seeded.ProductId)
            .Select(item => item.CategoryId).SingleAsync(TestContext.Current.CancellationToken);

        using var manager = factory.CreateClient();
        manager.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        using var hide = await manager.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/categories/{categoryId}/visibility",
            new { isVisible = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, hide.StatusCode);

        using var kitchen = factory.CreateClient();
        kitchen.DefaultRequestHeaders.Authorization = new("Bearer", "kitchen");
        using var read = await kitchen.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/products/availability", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, read.StatusCode);
        using var products = JsonDocument.Parse(await read.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Empty(products.RootElement.EnumerateArray());
        using var update = await kitchen.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/products/{seeded.ProductId}/availability",
            new { isAvailable = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, update.StatusCode);
    }
}
