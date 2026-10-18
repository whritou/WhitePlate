using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/tenant")]
[RequireTenant]
public sealed class TenantsController(ICurrentTenant currentTenant, IEstablishmentSettingsRepository establishments,
    ICatalogPublicationRepository publications) : ControllerBase
{
    [HttpGet("establishment")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<PublicEstablishmentResponse>> GetEstablishment([FromQuery] string? locale, CancellationToken ct)
    {
        var tenant = await establishments.GetAsync(currentTenant.Tenant!.Id, ct);
        if (tenant is null) return NotFound();
        var published = await publications.GetPublishedCatalogAsync(tenant.Id, ct);
        var establishment = published is null
            ? PublicEstablishmentDto.FromTenant(tenant, locale)
            : PublicEstablishmentDto.FromTenant(tenant, locale, published.Locales, published.DefaultLocale);
        return PublicEstablishmentResponse.FromDto(establishment);
    }

    [HttpGet("/api/v1/public/restaurants/{restaurantSlug}/establishment")]
    [RequireTenantBySlug]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<PublicEstablishmentResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public Task<ActionResult<PublicEstablishmentResponse>> GetEstablishmentByRestaurantSlug(
        [FromQuery] string? locale,
        CancellationToken ct) => GetEstablishment(locale, ct);

    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<TenantResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status500InternalServerError, "application/problem+json")]
    public async Task<ActionResult<TenantResponse>> Get(CancellationToken ct)
    {
        var tenant = currentTenant.Tenant ?? throw new InvalidOperationException("Tenant resolution is required.");
        var published = await publications.GetPublishedCatalogAsync(tenant.Id, ct);
        return published is null
            ? new TenantResponse(tenant.Id, tenant.Name, tenant.Subdomain, tenant.Currency,
                tenant.DefaultMenuLocale, tenant.MenuLocales)
            : new TenantResponse(tenant.Id, tenant.Name, tenant.Subdomain, published.Currency,
                published.DefaultLocale, published.Locales);
    }
}
