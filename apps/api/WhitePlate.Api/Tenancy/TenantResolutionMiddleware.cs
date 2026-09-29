using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Tenancy;

public sealed class TenantResolutionMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, TenantHostResolver hosts, CurrentTenant current,
        ApiErrorMapper errors)
    {
        if (context.GetEndpoint()?.Metadata.GetMetadata<RequireTenantAttribute>() is null)
        {
            await next(context);
            return;
        }

        var subdomain = hosts.Resolve(context.Request.Host);
        if (subdomain is null)
        {
            await errors.WriteAsync(context, errors.Create(context, new ApplicationError(ErrorCode.NotFound)), context.RequestAborted);
            return;
        }

        var handler = context.RequestServices.GetRequiredService<ResolveTenantQueryHandler>();
        var result = await handler.HandleAsync(new ResolveTenantQuery(subdomain), context.RequestAborted);
        if (!result.IsSuccess)
        {
            await errors.WriteAsync(context, errors.Create(context, result.Error), context.RequestAborted);
            return;
        }

        current.Set(result.Value);
        await next(context);
    }
}
