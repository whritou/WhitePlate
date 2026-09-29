using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed class OrganizationEndpointTests
{
    [Fact]
    public async Task RestaurantCreationRequiresAnAuthenticatedOrganizationOwner()
    {
        using var factory = new OrganizationFactory();
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync($"/api/v1/organizations/{Guid.NewGuid()}/restaurants",
            new { name = "Bistro", subdomain = "bistro", currency = "EUR" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task OrganizationOwnerCanCreateRestaurantWithItsOrganizationAndCurrency()
    {
        using var factory = new OrganizationFactory();
        var (organizationId, identity) = await factory.SeedOwnerAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", identity.Subject);

        using var response = await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/restaurants",
            new { name = "Bistro", subdomain = "bistro", currency = "EUR" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var restaurant = await response.Content.ReadFromJsonAsync<WhitePlate.Api.Contracts.TenantResponse>(TestContext.Current.CancellationToken);
        Assert.Equal("EUR", restaurant!.Currency);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var persisted = await database.Tenants.SingleAsync(TestContext.Current.CancellationToken);
        Assert.Equal(organizationId, persisted.OrganizationId);
    }

    [Fact]
    public async Task OrganizationOwnerCannotCreateRestaurantForAnotherOrganization()
    {
        using var factory = new OrganizationFactory();
        var (_, identity) = await factory.SeedOwnerAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", identity.Subject);

        using var response = await client.PostAsJsonAsync($"/api/v1/organizations/{Guid.NewGuid()}/restaurants",
            new { name = "Bistro", subdomain = "bistro", currency = "EUR" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>().Tenants.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task OwnerCanIssueSingleUseInvitationThatBindsTheAcceptingOidcIdentity()
    {
        using var factory = new OrganizationFactory();
        var (organizationId, ownerIdentity) = await factory.SeedOwnerAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ownerIdentity.Subject);
        using var restaurantResponse = await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/restaurants",
            new { name = "Bistro", subdomain = "bistro", currency = "EUR" }, TestContext.Current.CancellationToken);
        var restaurant = await restaurantResponse.Content.ReadFromJsonAsync<WhitePlate.Api.Contracts.TenantResponse>(TestContext.Current.CancellationToken);

        using var invitationResponse = await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/invitations",
            new { tenantId = restaurant!.Id, role = "KitchenStaff" }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, invitationResponse.StatusCode);
        using var invitationJson = JsonDocument.Parse(await invitationResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var token = invitationJson.RootElement.GetProperty("token").GetString()!;
        Assert.Equal(64, token.Length);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var persistedInvite = await database.StaffInvitations.SingleAsync(TestContext.Current.CancellationToken);
        Assert.NotEqual(token, persistedInvite.TokenHash);
        Assert.Equal(Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(token))).ToLowerInvariant(), persistedInvite.TokenHash);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "kitchen-1");
        using var accepted = await client.PostAsJsonAsync("/api/v1/invitations/accept", new { token }, TestContext.Current.CancellationToken);

        Assert.True(accepted.StatusCode == HttpStatusCode.NoContent,
            $"Expected no-content but got {(int)accepted.StatusCode}: {await accepted.Content.ReadAsStringAsync(TestContext.Current.CancellationToken)}");
        Assert.True(await database.RestaurantMemberships.AnyAsync(membership => membership.TenantId == restaurant.Id &&
            membership.Subject == "kitchen-1" && membership.Role == WhitePlate.Domain.Tenants.RestaurantRole.Kitchen,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task MeReturnsOnlyTheAuthenticatedUsersOrganizationMemberships()
    {
        using var factory = new OrganizationFactory();
        var (organizationId, identity) = await factory.SeedOwnerAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", identity.Subject);
        await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/restaurants",
            new { name = "Bistro", subdomain = "bistro", currency = "EUR" }, TestContext.Current.CancellationToken);
        using var response = await client.GetAsync("/api/v1/me", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("owner", json.RootElement.GetProperty("subject").GetString());
        Assert.Equal("Test Organization", json.RootElement.GetProperty("organizations")[0].GetProperty("name").GetString());
        Assert.Equal("Bistro", json.RootElement.GetProperty("restaurants")[0].GetProperty("name").GetString());
        Assert.Equal("OrganizationOwner", json.RootElement.GetProperty("restaurants")[0].GetProperty("role").GetString());
    }

    [Fact]
    public async Task RestaurantManagerCanCreateCategoryAndProductButKitchenRoleCannot()
    {
        using var factory = new OrganizationFactory();
        var (organizationId, ownerIdentity) = await factory.SeedOwnerAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ownerIdentity.Subject);
        using var restaurantResponse = await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/restaurants",
            new { name = "Bistro", subdomain = "bistro", currency = "EUR" }, TestContext.Current.CancellationToken);
        var restaurant = await restaurantResponse.Content.ReadFromJsonAsync<WhitePlate.Api.Contracts.TenantResponse>(TestContext.Current.CancellationToken);
        using var invitationResponse = await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/invitations",
            new { tenantId = restaurant!.Id, role = "RestaurantManager" }, TestContext.Current.CancellationToken);
        using var inviteJson = JsonDocument.Parse(await invitationResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var token = inviteJson.RootElement.GetProperty("token").GetString();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager-1");
        using var acceptance = await client.PostAsJsonAsync("/api/v1/invitations/accept", new { token }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, acceptance.StatusCode);

        using var categoryResponse = await client.PostAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/categories",
            new { name = "Mains", sortOrder = 0 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, categoryResponse.StatusCode);
        using var categoryJson = JsonDocument.Parse(await categoryResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var categoryId = categoryJson.RootElement.GetProperty("id").GetGuid();
        using var productResponse = await client.PostAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/products",
            new { categoryId, name = "Soup", description = "Seasonal soup", basePrice = 8.50m, taxRatePercent = 10m, sortOrder = 0 },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, productResponse.StatusCode);
        using var productJson = JsonDocument.Parse(await productResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var productId = productJson.RootElement.GetProperty("id").GetGuid();
        using var groupResponse = await client.PostAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/products/{productId}/option-groups",
            new { name = "Size", minimumSelections = 1, maximumSelections = 1, sortOrder = 0 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, groupResponse.StatusCode);
        using var groupJson = JsonDocument.Parse(await groupResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var groupId = groupJson.RootElement.GetProperty("id").GetGuid();
        using var optionResponse = await client.PostAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/option-groups/{groupId}/options",
            new { name = "Large", priceAdjustment = 1.50m, sortOrder = 0 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, optionResponse.StatusCode);
        using var optionJson = JsonDocument.Parse(await optionResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        using var discountResponse = await client.PostAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/discounts",
            new { code = "lunch", name = "Lunch", kind = "Percentage", value = 10m }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, discountResponse.StatusCode);
        using var discountJson = JsonDocument.Parse(await discountResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var discountId = discountJson.RootElement.GetProperty("id").GetGuid();

        using var updatedProduct = await client.PutAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/products/{productId}",
            new { name = "Soup Supreme", description = "Daily special", basePrice = 9.25m,
                taxRatePercent = 5m, sortOrder = 2, isAvailable = true }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, updatedProduct.StatusCode);
        using var updatedProductJson = JsonDocument.Parse(await updatedProduct.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Soup Supreme", updatedProductJson.RootElement.GetProperty("name").GetString());
        Assert.Equal(5m, updatedProductJson.RootElement.GetProperty("taxRatePercent").GetDecimal());

        using var updatedGroup = await client.PutAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/option-groups/{groupId}",
            new { name = "Portion", minimumSelections = 0, maximumSelections = 2, sortOrder = 1 },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, updatedGroup.StatusCode);
        using var updatedOption = await client.PutAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/options/{optionJson.RootElement.GetProperty("id").GetGuid()}",
            new { name = "XL", priceAdjustment = 2.25m, sortOrder = 1 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, updatedOption.StatusCode);
        using var updatedDiscount = await client.PutAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/discounts/{discountId}",
            new { name = "Lunch offer", kind = "FixedAmount", value = 3m }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, updatedDiscount.StatusCode);
        using var managedCatalog = await client.GetAsync($"/api/v1/tenants/{restaurant.Id}/catalog", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, managedCatalog.StatusCode);
        using var managedCatalogJson = JsonDocument.Parse(await managedCatalog.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(5m, managedCatalogJson.RootElement.GetProperty("products")[0].GetProperty("taxRatePercent").GetDecimal());
        Assert.Equal("Lunch offer", managedCatalogJson.RootElement.GetProperty("discounts")[0].GetProperty("name").GetString());
        using var deactivatedDiscount = await client.DeleteAsync($"/api/v1/tenants/{restaurant.Id}/discounts/{discountId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, deactivatedDiscount.StatusCode);
        using var archivedCategory = await client.DeleteAsync($"/api/v1/tenants/{restaurant.Id}/categories/{categoryId}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, archivedCategory.StatusCode);
        using var menu = await client.GetAsync("https://bistro.localhost/api/v1/menu", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, menu.StatusCode);
        using var menuJson = JsonDocument.Parse(await menu.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Empty(menuJson.RootElement.GetProperty("categories").EnumerateArray());
        using (var scope = factory.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            Assert.True(await database.MenuCategories.Where(category => category.Id == categoryId)
                .Select(category => category.IsArchived).SingleAsync(TestContext.Current.CancellationToken));
            Assert.True(await database.Products.Where(product => product.Id == productId)
                .Select(product => product.IsArchived).SingleAsync(TestContext.Current.CancellationToken));
            Assert.False(await database.PromotionDiscounts.Where(discount => discount.Id == discountId)
                .Select(discount => discount.IsActive).SingleAsync(TestContext.Current.CancellationToken));
        }

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ownerIdentity.Subject);
        using var kitchenInviteResponse = await client.PostAsJsonAsync($"/api/v1/organizations/{organizationId}/invitations",
            new { tenantId = restaurant.Id, role = "KitchenStaff" }, TestContext.Current.CancellationToken);
        using var kitchenInvite = JsonDocument.Parse(await kitchenInviteResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "kitchen-1");
        using var kitchenAccepted = await client.PostAsJsonAsync("/api/v1/invitations/accept",
            new { token = kitchenInvite.RootElement.GetProperty("token").GetString() }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, kitchenAccepted.StatusCode);
        using var forbiddenWrite = await client.PostAsJsonAsync($"/api/v1/tenants/{restaurant.Id}/categories",
            new { name = "Forbidden", sortOrder = 1 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, forbiddenWrite.StatusCode);
    }

    private sealed class OrganizationFactory : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Production");
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.ConfigureServices(services =>
            {
                services.AddAuthentication("test")
                    .AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>("test", _ => { });
                services.RemoveAll<DbContextOptions<WhitePlateDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WhitePlateDbContext>>();
                services.AddDbContext<WhitePlateDbContext>(options => options.UseSqlite(connection));
            });
        }

        public async Task<(Guid OrganizationId, ExternalIdentity Identity)> SeedOwnerAsync()
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
            var organization = Organization.Create("Test Organization");
            var identity = ExternalIdentity.Create("https://identity.example.test/", "owner");
            database.Organizations.Add(organization);
            database.OrganizationOwnerMemberships.Add(OrganizationOwnerMembership.Create(organization.Id, identity));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
            return (organization.Id, identity);
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) connection.Dispose();
        }
    }

    private sealed class TestAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var subject = Request.Headers.Authorization.ToString().Split(' ').LastOrDefault();
            if (string.IsNullOrWhiteSpace(subject)) return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new[]
            {
                new Claim("iss", "https://identity.example.test/"),
                new Claim("sub", subject)
            };
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
        }
    }
}
