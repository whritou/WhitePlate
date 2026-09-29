using System.Text.Json;
using WhitePlate.Application.Organizations;

namespace WhitePlate.Api.Configuration;

// Operator-only bootstrap; no public organization-signup endpoint is exposed.
public static class OrganizationProvisioning
{
    public static async Task<int> RunAsync(IServiceProvider services, IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        await using var scope = services.CreateAsyncScope();
        var handler = scope.ServiceProvider.GetRequiredService<ProvisionOrganizationCommandHandler>();
        try
        {
            var result = await handler.HandleAsync(new ProvisionOrganizationCommand(
                configuration["name"] ?? "", configuration["issuer"] ?? "", configuration["subject"] ?? ""),
                cancellationToken);
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
            var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("OrganizationProvisioning");
            logger.LogError("Organization provisioning failed with {ExceptionType}", exception.GetType().FullName);
            Console.Error.WriteLine("Organization provisioning failed. Check database configuration and applied migrations.");
            return 1;
        }
    }
}
