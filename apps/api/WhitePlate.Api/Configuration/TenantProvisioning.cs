using System.Text.Json;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Configuration;

// A local operator command, not an HTTP endpoint. Execution requires server/database access.
public static class TenantProvisioning
{
    public static async Task<int> RunAsync(IServiceProvider services, IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var handler = scope.ServiceProvider.GetRequiredService<CreateTenantCommandHandler>();
        try
        {
            var result = await handler.HandleAsync(new CreateTenantCommand(
                Guid.TryParse(configuration["organizationId"], out var organizationId) ? organizationId : Guid.Empty,
                configuration["name"] ?? "", configuration["subdomain"] ?? "",
                configuration["currency"] ?? "EUR"), cancellationToken);
            if (!result.IsSuccess)
            {
                Console.Error.WriteLine(result.Error.Code);
                foreach (var issue in result.Error.Issues)
                    Console.Error.WriteLine($"{issue.Field}: {issue.Message}");
                return 1;
            }

            Console.WriteLine(JsonSerializer.Serialize(result.Value, new JsonSerializerOptions(JsonSerializerDefaults.Web)));
            return 0;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("TenantProvisioning");
            logger.LogError("Tenant provisioning failed with {ExceptionType}", exception.GetType().FullName);
            Console.Error.WriteLine("Tenant provisioning failed. Check database configuration and applied migrations.");
            return 1;
        }
    }
}
