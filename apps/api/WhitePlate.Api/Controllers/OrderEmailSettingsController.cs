using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/order-email-settings")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class OrderEmailSettingsController(ICurrentIdentity identity, OrderEmailSettingsHandler handler,
    ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<OrderEmailSettingsDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Get(Guid tenantId, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        return Reply(await handler.GetAsync(tenantId, current, ct));
    }

    [HttpPut]
    [RequestSizeLimit(64 * 1024)]
    [ProducesResponseType<OrderEmailSettingsDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Put(Guid tenantId, UpdateOrderEmailSettingsRequest request, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        var header = Request.Headers.IfMatch.ToString();
        int? version = header.Length >= 3 && header.StartsWith('"') && header.EndsWith('"') &&
            int.TryParse(header[1..^1], NumberStyles.None, CultureInfo.InvariantCulture, out var number) && number > 0
                ? number : null;
        return Reply(await handler.SaveAsync(tenantId, current, request.Templates, version, ct));
    }

    private IActionResult Reply(Result<OrderEmailSettingsDto> result)
    {
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }
}
