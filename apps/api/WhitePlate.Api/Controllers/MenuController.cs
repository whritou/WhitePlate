using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/menu")]
[RequireTenant]
public sealed class MenuController(ICurrentTenant currentTenant, GetMenuQueryHandler getMenu) : ControllerBase
{
    [HttpGet]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<MenuDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuDto>> Get(CancellationToken cancellationToken)
    {
        var tenant = currentTenant.Tenant ?? throw new InvalidOperationException("Tenant resolution is required.");
        return Ok(await getMenu.HandleAsync(tenant, cancellationToken));
    }
}
