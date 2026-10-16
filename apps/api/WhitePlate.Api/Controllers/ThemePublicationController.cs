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
[Route("api/v1/tenants/{tenantId:guid}/theme/publication")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class ThemePublicationController(ICurrentIdentity identity, ThemePublicationHandler handler,
    ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ThemePublicationDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> Get(Guid tenantId, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        return Reply(await handler.GetAsync(tenantId, current, ct));
    }

    [HttpPost]
    [RequestSizeLimit(4096)]
    [ProducesResponseType<ThemePublicationDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status412PreconditionFailed, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status422UnprocessableEntity, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status428PreconditionRequired, "application/problem+json")]
    public async Task<IActionResult> Post(Guid tenantId, PublishThemeRequest request, CancellationToken ct)
    {
        if (identity.Identity is not { } current) return Unauthorized();
        var header = Request.Headers.IfMatch.ToString();
        int? version = header.Length >= 3 && header.StartsWith('"') && header.EndsWith('"') &&
            int.TryParse(header[1..^1], NumberStyles.None, CultureInfo.InvariantCulture, out var number) && number > 0
                ? number : null;
        return Reply(await handler.PublishAsync(tenantId, current, request, version, ct));
    }

    private IActionResult Reply(Result<ThemePublicationDto> result)
    {
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }
}
