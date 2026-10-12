using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Orders;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/pickup-slots")]
public sealed class PickupSlotsController(ICurrentTenant currentTenant, IOrderRepository orders,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpGet]
    [RequireTenant]
    [AllowAnonymous]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<PickupAvailabilityDto>> Get(CancellationToken cancellationToken)
    {
        var tenant = currentTenant.Tenant ?? throw new InvalidOperationException("Tenant resolution is required.");
        Response.Headers.CacheControl = "no-store";
        return Ok(await orders.GetPickupSlotsAsync(tenant.Id, timeProvider.GetUtcNow(), cancellationToken));
    }
}
