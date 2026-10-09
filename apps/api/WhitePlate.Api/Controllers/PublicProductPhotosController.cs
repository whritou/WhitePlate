using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Errors;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Media;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Controllers;

[ApiController]
[RequireTenant]
[Route("api/v1/products/{productId:guid}/photos/{assetId:guid}/{size:int}")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class PublicProductPhotosController(ICurrentTenant tenant, ProductPhotoService photos, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<byte[]>(200, "image/webp")]
    public async Task<IActionResult> Get(Guid productId, Guid assetId, int size, CancellationToken ct)
    {
        var result = await photos.ReadAsync(tenant.Tenant!.Id, productId, assetId, size, null, ct);
        Response.Headers.XContentTypeOptions = "nosniff";
        return result.IsSuccess ? File(result.Value.Bytes, result.Value.ContentType) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }
}
