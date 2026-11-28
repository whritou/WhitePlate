using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using WhitePlate.Api.Configuration;
using WhitePlate.Api.Errors;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed class SafeExceptionDescriptionTests
{
    [Fact]
    public void DescribesTheRootCauseTypeAndMessage()
    {
        var exception = new InvalidOperationException("An exception has been raised that is likely due to a transient failure.",
            new IOException("Could not read the CA file.",
                new UnauthorizedAccessException("Access to the path '/certs/root.crt' is denied.")));

        Assert.Equal("UnauthorizedAccessException: Access to the path '/certs/root.crt' is denied.",
            SafeExceptionDescription.Describe(exception));
    }

    [Fact]
    public void RedactsConnectionStringSecretsUrlCredentialsAndBoundsLength()
    {
        var description = SafeExceptionDescription.Describe(new InvalidOperationException(
            "Host=db;Username=whiteplate;Password=s3cr3t;SSL Mode=VerifyFull\npostgres://app:hunter2@db:5432/app"));

        Assert.DoesNotContain("s3cr3t", description);
        Assert.DoesNotContain("hunter2", description);
        Assert.DoesNotContain("whiteplate", description);
        Assert.DoesNotContain("\n", description);
        Assert.Contains("Password=[redacted]", description);
        Assert.StartsWith("InvalidOperationException: ", description);
        Assert.True(SafeExceptionDescription.Sanitize(new string('x', 1000)).Length <= 303);
        Assert.Equal("(no message)", SafeExceptionDescription.Sanitize(" "));
    }

    [Fact]
    public async Task DatabaseReadinessFailureHasANonSecretDescription()
    {
        var path = Path.Combine(Path.GetTempPath(), "whiteplate-health", Guid.NewGuid().ToString("N"), "api.db");
        await using var connection = new SqliteConnection($"Data Source={path}");
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);

        var result = await new DatabaseReadinessHealthCheck(database).CheckHealthAsync(new HealthCheckContext(),
            TestContext.Current.CancellationToken);

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
        Assert.False(string.IsNullOrWhiteSpace(result.Description));
        Assert.DoesNotContain("Data Source", result.Description, StringComparison.OrdinalIgnoreCase);
        Assert.Null(result.Exception);
    }
}
