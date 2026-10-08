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
    public async Task CategoryVisibilityPersistsWithoutArchivalAndBlocksStaleCheckoutUntilShownAgain()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        Guid categoryId;
        using (var scope = factory.Services.CreateScope())
        {
            categoryId = await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>()
                .Products.Where(item => item.Id == seeded.ProductId).Select(item => item.CategoryId)
                .SingleAsync(TestContext.Current.CancellationToken);
        }

        var path = $"/api/v1/tenants/{seeded.TenantId}/categories/{categoryId}/visibility";
        using var hide = await client.PutAsJsonAsync(path, new { isVisible = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, hide.StatusCode);
        using var read = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/catalog", TestContext.Current.CancellationToken);
        using var catalog = JsonDocument.Parse(await read.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.False(catalog.RootElement.GetProperty("categories")[0].GetProperty("isVisible").GetBoolean());
        Assert.False(catalog.RootElement.GetProperty("categories")[0].GetProperty("isArchived").GetBoolean());
        Assert.True(catalog.RootElement.GetProperty("products")[0].GetProperty("isAvailable").GetBoolean());
        Assert.False(catalog.RootElement.GetProperty("optionGroups")[0].GetProperty("isArchived").GetBoolean());
        using var menu = await client.GetAsync("https://bistro.example.test/api/v1/menu", TestContext.Current.CancellationToken);
        using var menuJson = JsonDocument.Parse(await menu.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Empty(menuJson.RootElement.GetProperty("categories").EnumerateArray());
        using var otherMenu = await client.GetAsync("https://other.example.test/api/v1/menu", TestContext.Current.CancellationToken);
        using var otherJson = JsonDocument.Parse(await otherMenu.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Single(otherJson.RootElement.GetProperty("categories").EnumerateArray());

        using var blockedRequest = CheckoutRequest(seeded.ProductId, seeded.OptionId, "hidden-category-checkout");
        using var blocked = await client.SendAsync(blockedRequest, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, blocked.StatusCode);
        using (var scope = factory.Services.CreateScope())
            Assert.Empty(await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>().Orders
                .ToListAsync(TestContext.Current.CancellationToken));

        using var show = await client.PutAsJsonAsync(path, new { isVisible = true }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, show.StatusCode);
        using var shownMenu = await client.GetAsync("https://bistro.example.test/api/v1/menu", TestContext.Current.CancellationToken);
        using var shownJson = JsonDocument.Parse(await shownMenu.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Single(shownJson.RootElement.GetProperty("categories").EnumerateArray());
        using var acceptedRequest = CheckoutRequest(seeded.ProductId, seeded.OptionId, "shown-category-checkout");
        using var accepted = await client.SendAsync(acceptedRequest, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, accepted.StatusCode);
    }

    [Theory]
    [InlineData("kitchen")]
    [InlineData("foreign-manager")]
    [InlineData("revoked-manager")]
    public async Task CategoryVisibilityRejectsDisallowedOrRevokedMembership(string subject)
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        await factory.SeedMembershipAsync(seeded.TenantId, "revoked-manager", RestaurantRole.Manager);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var categoryId = await database.Products.Where(item => item.Id == seeded.ProductId)
            .Select(item => item.CategoryId).SingleAsync(TestContext.Current.CancellationToken);
        var otherTenantId = await database.Products.Where(item => item.Id == seeded.OtherProductId)
            .Select(item => item.TenantId).SingleAsync(TestContext.Current.CancellationToken);
        await factory.SeedMembershipAsync(otherTenantId, "foreign-manager", RestaurantRole.Manager);
        if (subject == "revoked-manager")
        {
            // Removing the persisted membership simulates revocation between requests.
            database.RestaurantMemberships.RemoveRange(await database.RestaurantMemberships
                .Where(item => item.TenantId == seeded.TenantId).ToListAsync(TestContext.Current.CancellationToken));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", subject);
        using var response = await client.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/categories/{categoryId}/visibility",
            new { isVisible = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.True(await database.MenuCategories.Where(item => item.Id == categoryId)
            .Select(item => item.IsVisible).SingleAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task CategoryVisibilityRequiresAnExplicitBooleanAndRejectsForeignAndArchivedResources()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedOwnerAsync(seeded.OrganizationId, "owner");
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var categoryId = await database.Products.Where(item => item.Id == seeded.ProductId)
            .Select(item => item.CategoryId).SingleAsync(TestContext.Current.CancellationToken);
        var foreignCategoryId = await database.Products.Where(item => item.Id == seeded.OtherProductId)
            .Select(item => item.CategoryId).SingleAsync(TestContext.Current.CancellationToken);
        using var client = factory.CreateClient();
        var path = $"/api/v1/tenants/{seeded.TenantId}/categories/{categoryId}/visibility";
        using var anonymous = await client.PutAsJsonAsync(path, new { isVisible = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "owner");
        using var missing = await client.PutAsJsonAsync(path, new { }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, missing.StatusCode);
        using var malformed = await client.PutAsJsonAsync(path, new { isVisible = "false" }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, malformed.StatusCode);
        using var foreign = await client.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/categories/{foreignCategoryId}/visibility",
            new { isVisible = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        using var ownerHide = await client.PutAsJsonAsync(path, new { isVisible = false }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, ownerHide.StatusCode);
        using var archive = await client.DeleteAsync($"/api/v1/tenants/{seeded.TenantId}/categories/{categoryId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, archive.StatusCode);
        using var restoreVisibility = await client.PutAsJsonAsync(path, new { isVisible = true }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, restoreVisibility.StatusCode);
    }

    private static HttpRequestMessage CheckoutRequest(Guid productId, Guid optionId, string key)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "https://bistro.example.test/api/v1/orders")
        {
            Content = JsonContent.Create(new { customerName = "Ada",
                items = new[] { new { productId, quantity = 1, optionIds = new[] { optionId } } } })
        };
        request.Headers.Add("Idempotency-Key", key);
        return request;
    }
}
