using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Orders;
using WhitePlate.Application.Identity;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/dashboard/metrics")]
public sealed class DashboardMetricsController(ICurrentIdentity currentIdentity,
    GetDashboardMetricsQueryHandler getDashboardMetrics, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<DashboardMetricsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status403Forbidden, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<DashboardMetricsDto>> Get(Guid tenantId, CancellationToken cancellationToken)
    {
        Response.Headers.CacheControl = "no-store";
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();

        var result = await getDashboardMetrics.HandleAsync(new DashboardMetricsQuery(tenantId), identity,
            cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }
}
