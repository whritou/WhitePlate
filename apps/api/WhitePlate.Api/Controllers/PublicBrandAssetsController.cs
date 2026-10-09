using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Errors;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Media;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[RequireTenant]
[Route("api/v1/brand-assets")]
public sealed class PublicBrandAssetsController(ICurrentTenant tenant, BrandMediaService media, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet("{slot}")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<byte[]>(StatusCodes.Status200OK, "image/png", "image/webp")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status503ServiceUnavailable, "application/problem+json")]
    public async Task<IActionResult> Get(string slot, CancellationToken ct)
    {
        var result = await media.PublicAsync(tenant.Tenant!.Id, slot, ct);
        Response.Headers.XContentTypeOptions = "nosniff";
        return result.IsSuccess ? File(result.Value.Bytes, result.Value.ContentType) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }
}
