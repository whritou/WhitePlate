using WhitePlate.Api.Configuration;
using WhitePlate.Api.Errors;
using WhitePlate.Api.Tenancy;
using WhitePlate.Api.Realtime;

var provisionTenant = args.Contains("--provision-tenant", StringComparer.Ordinal);
var provisionOrganization = args.Contains("--provision-organization", StringComparer.Ordinal);
var builder = WebApplication.CreateBuilder(args.Where(argument => argument is not "--provision-tenant" and not "--provision-organization").ToArray());

builder.Services.AddWhitePlate(builder.Configuration, builder.Environment.IsProduction());
// EF diagnostics can include provider exception details; centralized logging uses safe metadata.
builder.Logging.AddFilter("Microsoft.EntityFrameworkCore", LogLevel.None);

await using var app = builder.Build();

if (provisionTenant)
{
    Environment.ExitCode = await TenantProvisioning.RunAsync(app.Services, app.Configuration, CancellationToken.None);
    return;
}

if (provisionOrganization)
{
    Environment.ExitCode = await OrganizationProvisioning.RunAsync(app.Services, app.Configuration, CancellationToken.None);
    return;
}

app.UseExceptionHandler();
app.UseStatusCodePages(async statusContext =>
{
    var context = statusContext.HttpContext;
    var mapper = context.RequestServices.GetRequiredService<ApiErrorMapper>();
    await mapper.WriteAsync(context, mapper.FromStatus(context, context.Response.StatusCode), context.RequestAborted);
});

var swaggerEnabled = app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled");
if (swaggerEnabled)
{
    app.MapOpenApi();
}

// Render terminates HTTPS before forwarding requests to this HTTP container.
if (!app.Configuration.GetValue<bool>("RENDER"))
{
    app.UseHttpsRedirection();
}

app.UseRouting();
app.UseMiddleware<RequestBodySizeLimitMiddleware>();
app.UseMiddleware<TenantResolutionMiddleware>();
app.UseCors("Browser");
app.UseAuthentication();
app.UseAuthorization();

if (swaggerEnabled)
{
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/openapi/v1.json", "WhitePlate API v1"));
}

app.MapControllers();
app.MapMethods("/", ["GET", "HEAD"], () => Results.Ok()).ExcludeFromDescription();
app.MapHub<KitchenHub>("/hubs/orders").RequireAuthorization();

app.Run();

public partial class Program;
