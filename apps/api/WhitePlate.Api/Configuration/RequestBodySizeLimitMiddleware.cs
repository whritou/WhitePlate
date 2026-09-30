using Microsoft.AspNetCore.Http.Metadata;
using WhitePlate.Api.Errors;

namespace WhitePlate.Api.Configuration;

public sealed class RequestBodySizeLimitMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context, ApiErrorMapper errors)
    {
        var maxBytes = context.GetEndpoint()?.Metadata.GetMetadata<IRequestSizeLimitMetadata>()?.MaxRequestBodySize;
        if (maxBytes is null)
        {
            await next(context);
            return;
        }

        if (context.Request.ContentLength > maxBytes)
        {
            await errors.WriteAsync(context, errors.FromStatus(context, StatusCodes.Status413PayloadTooLarge),
                context.RequestAborted);
            return;
        }

        context.Request.EnableBuffering(bufferThreshold: (int)Math.Min(maxBytes.Value, 30 * 1024));
        var buffer = new byte[8192];
        long totalBytes = 0;
        int read;
        while ((read = await context.Request.Body.ReadAsync(buffer, context.RequestAborted)) > 0)
        {
            totalBytes += read;
            if (totalBytes > maxBytes.Value)
            {
                await errors.WriteAsync(context, errors.FromStatus(context, StatusCodes.Status413PayloadTooLarge),
                    context.RequestAborted);
                return;
            }
        }
        context.Request.Body.Position = 0;

        await next(context);
    }
}
