using Microsoft.AspNetCore.Diagnostics;
using WhitePlate.Application.Common.Errors;

namespace WhitePlate.Api.Errors;

public sealed class ApiExceptionHandler(ApiErrorMapper mapper, ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception,
        CancellationToken cancellationToken)
    {
        // Never pass exception messages, data or stack traces to logs or clients: they may contain secrets.
        logger.LogError("Request exception {ExceptionType}, trace {TraceId}",
            exception.GetType().FullName, System.Diagnostics.Activity.Current?.Id ?? context.TraceIdentifier);

        var problem = exception is BadHttpRequestException badRequest
            ? mapper.FromStatus(context, badRequest.StatusCode)
            : mapper.Create(context, new ApplicationError(ErrorCode.Unexpected));
        await mapper.WriteAsync(context, problem, cancellationToken);
        return true;
    }
}
