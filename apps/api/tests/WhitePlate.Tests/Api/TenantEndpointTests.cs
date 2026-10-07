using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using WhitePlate.Api.Configuration;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Realtime;
using WhitePlate.Api.Tenancy;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed class TenantEndpointTests
{
    [Fact]
    public async Task LocalProvisioningCreatesTenantAndRejectsDuplicateWithoutAnotherWrite()
    {
        using var factory = new TenantFactory();
        using var client = factory.CreateClient();
        var organizationId = await factory.SeedAsync();
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["organizationId"] = organizationId.ToString(), ["name"] = "Third", ["subdomain"] = "THIRD", ["currency"] = "EUR"
        }).Build();
        Assert.Equal(0, await TenantProvisioning.RunAsync(factory.Services, configuration, TestContext.Current.CancellationToken));
        Assert.Equal(1, await TenantProvisioning.RunAsync(factory.Services, configuration, TestContext.Current.CancellationToken));
        var tenant = await client.GetFromJsonAsync<TenantResponse>("https://third.example.test/api/v1/tenant", TestContext.Current.CancellationToken);
        Assert.Equal("Third", tenant!.Name);
        using var scope = factory.Services.CreateScope();
        Assert.Equal(4, await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>().Tenants.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task HostsSelectSeparateTenantsAndHeadersCannotOverrideThem()
    {
        using var factory = new TenantFactory();
        using var client = factory.CreateClient();
        await factory.SeedAsync();
        foreach (var subdomain in new[] { "first", "second", "first" })
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"https://{subdomain}.example.test/api/v1/tenant");
            request.Headers.Add("X-Tenant-Subdomain", "second");
            request.Headers.Add("X-Tenant-Id", Guid.NewGuid().ToString());
            request.Headers.Add("X-Forwarded-Host", "second.example.test");
            using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.True(response.Headers.CacheControl?.NoStore);
            var tenant = await response.Content.ReadFromJsonAsync<TenantResponse>(TestContext.Current.CancellationToken);
            Assert.Equal(subdomain, tenant!.Subdomain);
            Assert.Equal(subdomain == "first" ? "First" : "Second", tenant.Name);
        }
    }

    [Theory]
    [InlineData("missing.example.test")]
    [InlineData("inactive.example.test")]
    [InlineData("example.test")]
    [InlineData("first.example.test.evil.test")]
    [InlineData("first.other.test")]
    [InlineData("nested.first.example.test")]
    public async Task UnknownInactiveAndInvalidHostsFailClosed(string host)
    {
        using var factory = new TenantFactory();
        using var client = factory.CreateClient();
        await factory.SeedAsync();
        client.DefaultRequestHeaders.Add("X-Tenant-Subdomain", "first");
        using var response = await client.GetAsync($"https://{host}/api/v1/tenant", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        var problem = await response.Content.ReadFromJsonAsync<ApiProblemResponse>(TestContext.Current.CancellationToken);
        Assert.Equal("not_found", problem!.Code);
    }

    [Fact]
    public async Task DoesNotExposeAnonymousTenantProvisioning()
    {
        using var factory = new TenantFactory();
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync("https://first.example.test/api/v1/tenant",
            new { name = "Attacker", subdomain = "attacker" }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.MethodNotAllowed, response.StatusCode);
    }

    private sealed class TenantFactory : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Production");
            builder.UseSetting("Authentication:Issuer", "https://localhost:3000");
            builder.UseSetting("Authentication:Audience", "whiteplate-api");
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.ConfigureServices(services =>
            {
                var archiveDispatcher = services.FirstOrDefault(descriptor => descriptor.ServiceType == typeof(IHostedService) &&
                    descriptor.ImplementationType == typeof(OrderArchiveDispatcher));
                if (archiveDispatcher is not null) services.Remove(archiveDispatcher);
                services.PostConfigure<TenantHostOptions>(options => options.BaseDomain = "example.test");
                services.RemoveAll<DbContextOptions<WhitePlateDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WhitePlateDbContext>>();
                services.AddDbContext<WhitePlateDbContext>(options => options.UseSqlite(connection));
            });
        }

        public async Task<Guid> SeedAsync()
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
            var organization = WhitePlate.Domain.Organizations.Organization.Create("Test Organization");
            database.Organizations.Add(organization);
            var inactive = Tenant.Create(organization.Id, "Inactive", "inactive", "EUR");
            inactive.Deactivate();
            database.Tenants.AddRange(Tenant.Create(organization.Id, "First", "first", "EUR"),
                Tenant.Create(organization.Id, "Second", "second", "EUR"), inactive);
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
            return organization.Id;
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) connection.Dispose();
        }
    }
}
