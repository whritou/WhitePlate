using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using WhitePlate.Api.Errors;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Api.Configuration;

public sealed class DatabaseReadinessHealthCheck(WhitePlateDbContext database) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await database.Database.CanConnectAsync(cancellationToken)
                ? HealthCheckResult.Healthy("Database connection succeeded.")
                : HealthCheckResult.Unhealthy("Database connection could not be opened.");
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            // The description is only logged by the health-check service; the HTTP body stays the status
            // word. The raw exception is not attached because provider messages may contain secrets.
            return HealthCheckResult.Unhealthy(
                $"Database connection failed ({SafeExceptionDescription.Describe(exception)}).");
        }
    }
}
