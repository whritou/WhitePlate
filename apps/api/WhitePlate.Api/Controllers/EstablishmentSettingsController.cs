using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/establishment-settings")]
public sealed class EstablishmentSettingsController(ICurrentIdentity currentIdentity,
    EstablishmentSettingsHandler handler, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<EstablishmentSettingsResponse>(StatusCodes.Status200OK)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Get(Guid tenantId, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        return Settings(await handler.GetAsync(tenantId, identity, ct));
    }

    [HttpGet("options")]
    [ProducesResponseType<EstablishmentOptionsResponse>(StatusCodes.Status200OK)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> Options(Guid tenantId, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.GetOptionsAsync(tenantId, identity, ct);
        return result.IsSuccess ? Ok(new EstablishmentOptionsResponse(result.Value.TimeZones, result.Value.Countries))
            : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpGet("legal-profile")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> GetLegalProfile(Guid tenantId, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.GetLegalProfileAsync(tenantId, identity, ct);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.CacheControl = "no-store";
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }

    [HttpPut("legal-profile")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [RequestSizeLimit(65536)]
    public async Task<IActionResult> PutLegalProfile(Guid tenantId, UpdateTenantLegalProfileRequest request,
        CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.SaveLegalProfileAsync(tenantId, identity,
            new UpdateTenantLegalProfileInput(request.Mode, request.LegalCountryCode, request.LegalName,
                request.LegalRegistrationNumber, request.TaxIdentifier), ParseVersion(), ct);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.CacheControl = "no-store";
        Response.Headers.ETag = $"\"{result.Value.Version}\"";
        return Ok(result.Value);
    }

    [HttpPut]
    [ProducesResponseType<EstablishmentSettingsResponse>(StatusCodes.Status200OK)]
    [RequestSizeLimit(65536)]
    public async Task<IActionResult> Put(Guid tenantId, UpdateEstablishmentSettingsRequest request, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var header = Request.Headers.IfMatch.ToString();
        int? version = header.Length >= 3 && header.StartsWith('"') && header.EndsWith('"') &&
            int.TryParse(header[1..^1], NumberStyles.None, CultureInfo.InvariantCulture, out var parsed) && parsed > 0 ? parsed : null;
        return Settings(await handler.SaveAsync(tenantId, identity, request.ToInput(), version, ct));
    }

    [HttpPut("opening-hours")]
    [RequestSizeLimit(65536)]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> PutOpeningHours(Guid tenantId, UpdateOpeningHoursRequest request, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        return Settings(await handler.SaveOpeningHoursAsync(tenantId, identity, request.OpeningHours,
            ParseVersion(), false, ct));
    }

    [HttpDelete("opening-hours")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<IActionResult> DeleteOpeningHours(Guid tenantId, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        return Settings(await handler.SaveOpeningHoursAsync(tenantId, identity, null, ParseVersion(), true, ct));
    }

    private int? ParseVersion()
    {
        var header = Request.Headers.IfMatch.ToString();
        return header.Length >= 3 && header.StartsWith('"') && header.EndsWith('"') &&
            int.TryParse(header[1..^1], NumberStyles.None, CultureInfo.InvariantCulture, out var parsed) && parsed > 0 ? parsed : null;
    }

    private IActionResult Settings(Result<EstablishmentSettingsDto> result)
    {
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        Response.Headers.CacheControl = "no-store";
        Response.Headers.ETag = $"\"{result.Value.EstablishmentVersion}\"";
        return Ok(EstablishmentSettingsResponse.FromDto(result.Value));
    }
}
