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
[Route("api/v1/tenants/{tenantId:guid}/brand-assets")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
[ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
[ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
[ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
[ProducesResponseType<ApiProblemResponse>(StatusCodes.Status503ServiceUnavailable, "application/problem+json")]
public sealed class BrandAssetsController(BrandMediaService media, ICurrentIdentity currentIdentity, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<BrandAssetsDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(Guid tenantId, CancellationToken ct)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Fail(new(ErrorCode.Unauthorized));
        var result = await media.ListAsync(tenantId, identity, ct);
        return result.IsSuccess ? Ok(result.Value) : Fail(result.Error);
    }

    [HttpPost("{slot}/uploads")]
    [RequestSizeLimit(4 * 1024 * 1024)]
    [Consumes("application/octet-stream")]
    [ProducesResponseType<MediaAssetDto>(StatusCodes.Status201Created)]
    public async Task<IActionResult> Upload(Guid tenantId, string slot, [FromQuery] string aspect = "16:9", CancellationToken ct = default)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Fail(new(ErrorCode.Unauthorized));
        if (!await media.CanManageAsync(tenantId, identity, ct)) return Fail(new(ErrorCode.NotFound));
        var maximum = slot switch { "logo" => 2, "favicon" => 1, "banner" => 4, _ => 0 } * 1024 * 1024;
        if (maximum == 0 || Request.ContentLength > maximum) return Fail(new(ErrorCode.ValidationFailed));
        using var buffer = new MemoryStream();
        var chunk = new byte[64 * 1024];
        int read;
        while ((read = await Request.Body.ReadAsync(chunk, ct)) > 0)
        {
            if (buffer.Length + read > maximum) return Fail(new(ErrorCode.ValidationFailed));
            await buffer.WriteAsync(chunk.AsMemory(0, read), ct);
        }
        var result = await media.UploadAsync(tenantId, slot, aspect, buffer.ToArray(), identity, ct);
        return result.IsSuccess ? StatusCode(201, result.Value) : Fail(result.Error);
    }

    [HttpGet("uploads/{assetId:guid}")]
    [ProducesResponseType<byte[]>(StatusCodes.Status200OK, "image/png", "image/webp")]
    public async Task<IActionResult> Preview(Guid tenantId, Guid assetId, CancellationToken ct)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Fail(new(ErrorCode.Unauthorized));
        var result = await media.PreviewAsync(tenantId, assetId, identity, ct);
        Response.Headers.XContentTypeOptions = "nosniff";
        return result.IsSuccess ? File(result.Value.Bytes, result.Value.ContentType) : Fail(result.Error);
    }

    [HttpPut("{slot}")]
    [RequestSizeLimit(1024)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status412PreconditionFailed, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status428PreconditionRequired, "application/problem+json")]
    public async Task<IActionResult> Save(Guid tenantId, string slot, [FromBody] SaveBrandAssetRequest request, CancellationToken ct)
        => await Change(tenantId, slot, request.AssetId, ct);

    [HttpDelete("{slot}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(Guid tenantId, string slot, CancellationToken ct) => await Change(tenantId, slot, null, ct);

    private async Task<IActionResult> Change(Guid tenantId, string slot, Guid? candidate, CancellationToken ct)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Fail(new(ErrorCode.Unauthorized));
        if (!await media.CanManageAsync(tenantId, identity, ct)) return Fail(new(ErrorCode.NotFound));
        var match = Request.Headers.IfMatch.ToString().Trim('"');
        if (string.IsNullOrEmpty(match)) return Fail(new(ErrorCode.PreconditionRequired));
        Guid? expected = null;
        if (match != "none")
        {
            if (!Guid.TryParse(match.Trim('"'), out var parsed)) return Fail(new(ErrorCode.ValidationFailed));
            expected = parsed;
        }
        var result = await media.SaveAsync(tenantId, slot, candidate, expected, identity, ct);
        return result.IsSuccess ? NoContent() : Fail(result.Error);
    }

    private IActionResult Fail(ApplicationError error) => errors.ToActionResult(errors.Create(HttpContext, error));
}
