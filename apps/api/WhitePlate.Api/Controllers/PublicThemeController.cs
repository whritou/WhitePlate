using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[RequireTenant]
[Route("api/v1/theme")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PublicThemeController(ICurrentTenant tenant, ThemePublicationHandler handler,
    ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PublicThemeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var result = await handler.GetPublicAsync(tenant.Tenant!.Id, ct);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.CacheControl = "no-store";
        return Ok(result.Value);
    }
}
