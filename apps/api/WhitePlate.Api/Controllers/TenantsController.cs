using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/tenant")]
[RequireTenant]
public sealed class TenantsController(ICurrentTenant currentTenant) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<TenantResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status500InternalServerError, "application/problem+json")]
    public ActionResult<TenantResponse> Get()
    {
        var tenant = currentTenant.Tenant ?? throw new InvalidOperationException("Tenant resolution is required.");
        return new TenantResponse(tenant.Id, tenant.Name, tenant.Subdomain, tenant.Currency);
    }
}
