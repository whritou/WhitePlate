using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Media;

public sealed class ProductPhotoService(BrandMediaService access, IProductPhotoRepository photos,
    IMediaRepository metadata, IMediaStorage storage, IProductImageProcessor images, TimeProvider clock)
{
    public async Task<bool> CanAccessAsync(Guid tenantId, Guid productId, ExternalIdentity identity, bool writable, CancellationToken ct) =>
        await access.CanManageAsync(tenantId, identity, ct) && await photos.ProductExistsAsync(tenantId, productId, writable, ct);

    public async Task<Result<ProductPhotosDto>> ListAsync(Guid tenantId, Guid productId, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanAccessAsync(tenantId, productId, identity, false, ct)) return Fail<ProductPhotosDto>(ErrorCode.NotFound);
        return Result<ProductPhotosDto>.Success(new(storage.IsAvailable, (await photos.ListAsync(tenantId, productId, ct)).Select(ToDto).ToArray()));
    }

    public async Task<Result<ProductPhotoDto>> UploadAsync(Guid tenantId, Guid productId, string aspect, byte[] bytes,
        ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanAccessAsync(tenantId, productId, identity, true, ct)) return Fail<ProductPhotoDto>(ErrorCode.NotFound);
        if (!storage.IsAvailable) return Fail<ProductPhotoDto>(ErrorCode.Unavailable);
        try
        {
            var variants = await images.NormalizeAsync(aspect, bytes, ct);
            var main = variants[1200];
            var asset = WhitePlate.Domain.Media.MediaAsset.CreateProductPhoto(tenantId, productId, main.Width, main.Height,
                variants.Values.Sum(image => (long)image.Bytes.Length), clock.GetUtcNow());
            if (!await metadata.AddPendingAsync(asset, ct)) return Fail<ProductPhotoDto>(ErrorCode.RateLimited);
            foreach (var (size, image) in variants) await storage.PutAsync($"{asset.ObjectKey}/{size}", image.Bytes, image.ContentType, ct);
            await metadata.MarkReadyAsync(asset, ct);
            return Result<ProductPhotoDto>.Success(ToDto(asset));
        }
        catch (InvalidMediaException) { return Fail<ProductPhotoDto>(ErrorCode.ValidationFailed); }
        catch (MediaUnavailableException) { return Fail<ProductPhotoDto>(ErrorCode.Unavailable); }
    }

    public async Task<Result<ProductPhotosDto>> SaveAsync(Guid tenantId, Guid productId, IReadOnlyList<Guid> ids,
        IReadOnlyList<Guid> expected, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanAccessAsync(tenantId, productId, identity, true, ct)) return Fail<ProductPhotosDto>(ErrorCode.NotFound);
        if (ids.Count > 8 || expected.Count > 8 || ids.Distinct().Count() != ids.Count || expected.Distinct().Count() != expected.Count ||
            ids.Concat(expected).Contains(Guid.Empty)) return Fail<ProductPhotosDto>(ErrorCode.ValidationFailed);
        foreach (var id in ids)
        {
            var asset = await metadata.FindAsync(tenantId, id, ct);
            if (asset is null || asset.ProductId != productId || !asset.IsReady || asset.ExpiresAt <= clock.GetUtcNow() ||
                (asset.WasPublished && !asset.IsActive)) return Fail<ProductPhotosDto>(ErrorCode.NotFound);
            try { foreach (var size in new[] { 320, 640, 1200 }) await storage.GetAsync($"{asset.ObjectKey}/{size}", ct); }
            catch (MediaUnavailableException) { return Fail<ProductPhotosDto>(ErrorCode.Unavailable); }
        }
        if (!await CanAccessAsync(tenantId, productId, identity, true, ct)) return Fail<ProductPhotosDto>(ErrorCode.NotFound);
        if (!await photos.SaveAsync(tenantId, productId, ids, expected, clock.GetUtcNow(), ct)) return Fail<ProductPhotosDto>(ErrorCode.PreconditionFailed);
        return await ListAsync(tenantId, productId, identity, ct);
    }

    public async Task<Result<MediaContent>> ReadAsync(Guid tenantId, Guid productId, Guid id, int size,
        ExternalIdentity? identity, CancellationToken ct)
    {
        if (size is not (320 or 640 or 1200)) return Fail<MediaContent>(ErrorCode.NotFound);
        if (identity is not null ? !await CanAccessAsync(tenantId, productId, identity, false, ct) :
            !await photos.PublicProductExistsAsync(tenantId, productId, ct)) return Fail<MediaContent>(ErrorCode.NotFound);
        var asset = await metadata.FindAsync(tenantId, id, ct);
        if (asset is null || asset.ProductId != productId || !asset.IsReady || asset.ExpiresAt <= clock.GetUtcNow() ||
            (identity is null && !asset.IsActive)) return Fail<MediaContent>(ErrorCode.NotFound);
        try { return Result<MediaContent>.Success(new(await storage.GetAsync($"{asset.ObjectKey}/{size}", ct), "image/webp")); }
        catch (MediaUnavailableException) { return Fail<MediaContent>(ErrorCode.Unavailable); }
    }

    private static ProductPhotoDto ToDto(WhitePlate.Domain.Media.MediaAsset asset) => new(asset.Id, asset.Width, asset.Height, asset.Bytes);
    private static Result<T> Fail<T>(ErrorCode code) => Result<T>.Failure(new ApplicationError(code));
}
