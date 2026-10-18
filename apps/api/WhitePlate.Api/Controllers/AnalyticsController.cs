using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Configuration;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/analytics")]
public sealed class AnalyticsController(ICurrentIdentity currentIdentity,
    GetAnalyticsMetricsQueryHandler getMetrics, WithdrawAnalyticsConsentCommandHandler withdrawal,
    CheckoutRequestRateLimiter rateLimiter, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AnalyticsMetricsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<AnalyticsMetricsDto>> Get(Guid tenantId, [FromQuery] int days = 30,
        CancellationToken cancellationToken = default)
    {
        Response.Headers.CacheControl = "no-store";
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await getMetrics.HandleAsync(new AnalyticsMetricsQuery(tenantId, days), identity,
            cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("withdrawal")]
    [AllowAnonymous]
    [RequestSizeLimit(4096)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Withdraw(Guid tenantId, AnalyticsWithdrawalRequest request,
        CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        Response.Headers.Pragma = "no-cache";
        var address = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        using var lease = await rateLimiter.AcquireAsync($"analytics-withdrawal:{tenantId:N}:{address}",
            cancellationToken);
        if (!lease.IsAcquired) return StatusCode(StatusCodes.Status429TooManyRequests);

        var result = await withdrawal.HandleAsync(tenantId, request.Email, cancellationToken);
        return result.IsSuccess
            ? Ok(new { message = "If a matching analytics record exists, it has been deleted." })
            : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }
}
