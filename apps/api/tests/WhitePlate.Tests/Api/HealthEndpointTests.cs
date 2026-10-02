using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using WhitePlate.Api.Realtime;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed class HealthEndpointTests
{
    [Fact]
    public async Task LivenessDoesNotDependOnDatabaseAvailability()
    {
        using var factory = new HealthFactory(databaseReachable: false);
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/health/live", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task ReadinessReturnsOnlyGenericFailureWhenDatabaseIsUnavailable()
    {
        using var factory = new HealthFactory(databaseReachable: false);
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/health/ready", TestContext.Current.CancellationToken);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
        Assert.Equal("Unhealthy", body);
        Assert.DoesNotContain("Data Source", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ReadinessReturnsHealthyWhenDatabaseIsReachable()
    {
        using var factory = new HealthFactory(databaseReachable: true);
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/health/ready", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Healthy", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    private sealed class HealthFactory(bool databaseReachable) : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new(databaseReachable
            ? "Data Source=:memory:"
            : $"Data Source={Path.Combine(Path.GetTempPath(), "whiteplate-health", Guid.NewGuid().ToString("N"), "api.db")}");

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            if (databaseReachable) connection.Open();

            builder.UseEnvironment("Production");
            builder.UseSetting("Authentication:Issuer", "https://localhost:3000");
            builder.UseSetting("Authentication:Audience", "whiteplate-api");
            builder.ConfigureServices(services =>
            {
                var dispatcher = services.FirstOrDefault(descriptor => descriptor.ServiceType == typeof(IHostedService) &&
                    descriptor.ImplementationType == typeof(OrderOutboxDispatcher));
                if (dispatcher is not null) services.Remove(dispatcher);
                services.RemoveAll<DbContextOptions<WhitePlateDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WhitePlateDbContext>>();
                services.AddDbContext<WhitePlateDbContext>(options => options.UseSqlite(connection));
            });
        }

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) connection.Dispose();
        }
    }
}
