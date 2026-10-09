using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using WhitePlate.Api.Contracts;
using WhitePlate.Application.Common.Errors;

namespace WhitePlate.Api.Errors;

public sealed class ApiErrorMapper(ILogger<ApiErrorMapper> logger)
{
    public ApiProblemResponse Create(HttpContext context, ApplicationError error)
    {
        var (status, code, title, message) = error.Code switch
        {
            ErrorCode.Unavailable => (503, "unavailable", "Service Unavailable", "The service is temporarily unavailable. Please try again."),
            ErrorCode.RateLimited => (429, "rate_limited", "Too Many Requests", "Too many requests. Please try again later."),
            ErrorCode.ValidationFailed => (400, "validation_failed", "Bad Request", "One or more request fields are invalid."),
            ErrorCode.NotFound => (404, "not_found", "Not Found", "The requested resource was not found."),
            ErrorCode.Conflict => (409, "conflict", "Conflict", "The request conflicts with the current resource state."),
            ErrorCode.Unauthorized => (401, "unauthorized", "Unauthorized", "Authentication is required."),
            ErrorCode.Forbidden => (403, "forbidden", "Forbidden", "You do not have permission to perform this operation."),
            ErrorCode.PreconditionFailed => (412, "precondition_failed", "Precondition Failed", "The resource has changed since it was read."),
            ErrorCode.PreconditionRequired => (428, "precondition_required", "Precondition Required", "If-Match is required for this operation."),
            _ => (500, "unexpected_error", "Internal Server Error", "An unexpected error occurred. Please try again.")
        };

        return Create(context, status, code, title, message, error.Issues);
    }

    public ApiProblemResponse FromStatus(HttpContext context, int status) => status switch
    {
        400 => Create(context, new ApplicationError(ErrorCode.ValidationFailed)),
        401 => Create(context, new ApplicationError(ErrorCode.Unauthorized)),
        403 => Create(context, new ApplicationError(ErrorCode.Forbidden)),
        404 => Create(context, new ApplicationError(ErrorCode.NotFound)),
        409 => Create(context, new ApplicationError(ErrorCode.Conflict)),
        412 => Create(context, new ApplicationError(ErrorCode.PreconditionFailed)),
        428 => Create(context, new ApplicationError(ErrorCode.PreconditionRequired)),
        405 => Create(context, status, "method_not_allowed", "Method Not Allowed", "This method is not supported for this resource."),
        413 => Create(context, status, "request_too_large", "Content Too Large", "The request is too large."),
        415 => Create(context, status, "unsupported_media_type", "Unsupported Media Type", "The request content type is not supported."),
        429 => Create(context, status, "rate_limited", "Too Many Requests", "Too many requests. Please try again later."),
        500 => Create(context, new ApplicationError(ErrorCode.Unexpected)),
        _ => Create(context, status, "http_error", "Request Failed", "The request could not be completed.")
    };

    public ObjectResult ToActionResult(ApiProblemResponse problem) => new(problem)
    {
        StatusCode = problem.Status,
        ContentTypes = { "application/problem+json" }
    };

    public async Task WriteAsync(HttpContext context, ApiProblemResponse problem, CancellationToken cancellationToken)
    {
        context.Response.StatusCode = problem.Status!.Value;
        await context.Response.WriteAsJsonAsync(problem, options: null,
            contentType: "application/problem+json", cancellationToken: cancellationToken);
    }

    private ApiProblemResponse Create(HttpContext context, int status, string code, string title,
        string message, IReadOnlyList<ValidationIssue>? issues = null)
    {
        var traceId = Activity.Current?.Id ?? context.TraceIdentifier;
        context.Response.Headers.CacheControl = "no-store";
        // Route templates avoid logging user-controlled IDs, URLs, query strings or bodies.
        var route = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText ?? "unmatched";
        logger.Log(status >= 500 ? LogLevel.Error : LogLevel.Information,
            "API failure {ErrorCode}, status {StatusCode}, route {Route}, trace {TraceId}",
            code, status, route, traceId);

        return new ApiProblemResponse
        {
            Type = "about:blank",
            Title = title,
            Status = status,
            Detail = message,
            Code = code,
            TraceId = traceId,
            Errors = issues is { Count: > 0 }
                ? issues.Select(issue => new ValidationIssueResponse(issue.Field, issue.Code, issue.Message)).ToArray()
                : null
        };
    }
}
