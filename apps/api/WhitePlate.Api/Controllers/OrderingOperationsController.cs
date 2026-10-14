using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/ordering-operations")]
public sealed class OrderingOperationsController(ICurrentIdentity currentIdentity,
    OrderingOperationsHandler handler, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Get(Guid tenantId, CancellationToken cancellationToken)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.GetAsync(tenantId, identity, cancellationToken);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));

        Response.Headers.CacheControl = "no-store";
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }

    [HttpPut]
    [RequestSizeLimit(65536)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Put(Guid tenantId, UpdateOrderingOperationsRequest request,
        CancellationToken cancellationToken)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.UpdateAsync(tenantId, identity,
            new UpdateOrderingOperationsInput(request.AcceptingOrders, request.RushHoldEnabled),
            ParseVersion(), cancellationToken);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));

        Response.Headers.CacheControl = "no-store";
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }

    private int? ParseVersion()
    {
        var header = Request.Headers.IfMatch.ToString();
        return header.Length >= 3 && header.StartsWith('"') && header.EndsWith('"') &&
            int.TryParse(header[1..^1], NumberStyles.None, CultureInfo.InvariantCulture, out var parsed) && parsed > 0
            ? parsed
            : null;
    }
}

public sealed record UpdateOrderingOperationsRequest(bool AcceptingOrders, bool RushHoldEnabled);
