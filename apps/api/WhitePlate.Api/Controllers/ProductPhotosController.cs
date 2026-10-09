using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Errors;
using WhitePlate.Api.Contracts;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Media;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/products/{productId:guid}/photos")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[ProducesResponseType<ApiProblemResponse>(400, "application/problem+json")]
[ProducesResponseType<ApiProblemResponse>(401, "application/problem+json")]
[ProducesResponseType<ApiProblemResponse>(404, "application/problem+json")]
[ProducesResponseType<ApiProblemResponse>(503, "application/problem+json")]
public sealed class ProductPhotosController(ProductPhotoService photos, ICurrentIdentity currentIdentity, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<ProductPhotosDto>(200)]
    public async Task<IActionResult> List(Guid tenantId, Guid productId, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Fail(new(ErrorCode.Unauthorized));
        var result = await photos.ListAsync(tenantId, productId, identity, ct);
        return result.IsSuccess ? Ok(result.Value) : Fail(result.Error);
    }

    [HttpPost("uploads")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    [Consumes("application/octet-stream")]
    [ProducesResponseType<ProductPhotoDto>(201)]
    public async Task<IActionResult> Upload(Guid tenantId, Guid productId, [FromQuery] string aspect = "1:1", CancellationToken ct = default)
    {
        if (currentIdentity.Identity is not { } identity) return Fail(new(ErrorCode.Unauthorized));
        if (!await photos.CanAccessAsync(tenantId, productId, identity, true, ct)) return Fail(new(ErrorCode.NotFound));
        const int maximum = 4 * 1024 * 1024;
        if (Request.ContentLength > maximum) return Fail(new(ErrorCode.ValidationFailed));
        using var buffer = new MemoryStream();
        var chunk = new byte[64 * 1024];
        int read;
        while ((read = await Request.Body.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > maximum) return Fail(new(ErrorCode.ValidationFailed));
            await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
        }
        var result = await photos.UploadAsync(tenantId, productId, aspect, buffer.ToArray(), identity, ct);
        return result.IsSuccess ? StatusCode(201, result.Value) : Fail(result.Error);
    }

    [HttpGet("uploads/{assetId:guid}/{size:int}")]
    [ProducesResponseType<byte[]>(200, "image/webp")]
    public async Task<IActionResult> Preview(Guid tenantId, Guid productId, Guid assetId, int size, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Fail(new(ErrorCode.Unauthorized));
        var result = await photos.ReadAsync(tenantId, productId, assetId, size, identity, ct);
        Response.Headers.XContentTypeOptions = "nosniff";
        return result.IsSuccess ? File(result.Value.Bytes, result.Value.ContentType) : Fail(result.Error);
    }

    [HttpPut]
    [RequestSizeLimit(2048)]
    [ProducesResponseType<ProductPhotosDto>(200)]
    [ProducesResponseType<ApiProblemResponse>(412, "application/problem+json")]
    public async Task<IActionResult> Save(Guid tenantId, Guid productId, [FromBody] SaveProductPhotosRequest request, CancellationToken ct)
    {
        if (currentIdentity.Identity is not { } identity) return Fail(new(ErrorCode.Unauthorized));
        if (request.AssetIds is null || request.ExpectedIds is null) return Fail(new(ErrorCode.ValidationFailed));
        var result = await photos.SaveAsync(tenantId, productId, request.AssetIds, request.ExpectedIds, identity, ct);
        return result.IsSuccess ? Ok(result.Value) : Fail(result.Error);
    }
    private IActionResult Fail(ApplicationError error) => errors.ToActionResult(errors.Create(HttpContext, error));
}
