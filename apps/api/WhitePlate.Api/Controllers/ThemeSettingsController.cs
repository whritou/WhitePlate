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
[Route("api/v1/tenants/{tenantId:guid}/theme")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class ThemeSettingsController(ICurrentIdentity identity, ThemeSettingsHandler handler,
    ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(Guid tenantId, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        return Reply(await handler.GetAsync(tenantId, current, ct));
    }

    [HttpPut]
    [RequestSizeLimit(8192)]
    public async Task<IActionResult> Put(Guid tenantId, UpdateThemeRequest theme, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        var header = Request.Headers.IfMatch.ToString();
        int? version = header.Length >= 3 && header.StartsWith('"') && header.EndsWith('"') &&
            int.TryParse(header[1..^1], NumberStyles.None, CultureInfo.InvariantCulture, out var number) && number > 0
                ? number : null;
        return Reply(await handler.SaveAsync(tenantId, current, theme, version, ct));
    }

    [HttpGet("palette")]
    public async Task<IActionResult> Palette(Guid tenantId, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        var result = await handler.PaletteAsync(tenantId, current, ct);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    private IActionResult Reply(Result<ThemeDraftDto> result)
    {
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }
}
