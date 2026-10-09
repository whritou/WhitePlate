using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Media;

namespace WhitePlate.Application.Media;

public sealed class BrandMediaService(IStaffMembershipRepository memberships, IMediaRepository repository,
    IMediaStorage storage, IMediaImageProcessor images, TimeProvider clock)
{
    public Task<bool> CanManageAsync(Guid tenantId, ExternalIdentity identity, CancellationToken ct) =>
        CatalogAccess.CanManageAsync(memberships, tenantId, identity, ct);

    public async Task<Result<BrandAssetsDto>> ListAsync(Guid tenantId, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanManageAsync(tenantId, identity, ct)) return Failure<BrandAssetsDto>(ErrorCode.NotFound);
        return Result<BrandAssetsDto>.Success(new(storage.IsAvailable,
            (await repository.ActiveAsync(tenantId, ct)).Select(ToDto).ToArray()));
    }

    public async Task<Result<MediaAssetDto>> UploadAsync(Guid tenantId, string slot, string aspect, byte[] bytes,
        ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanManageAsync(tenantId, identity, ct)) return Failure<MediaAssetDto>(ErrorCode.NotFound);
        if (!storage.IsAvailable) return Failure<MediaAssetDto>(ErrorCode.Unavailable);
        try
        {
            var image = await images.NormalizeAsync(slot, aspect, bytes, ct);
            var asset = MediaAsset.Create(tenantId, slot, image.ContentType, image.Width, image.Height,
                image.Bytes.Length, clock.GetUtcNow());
            if (!await repository.AddPendingAsync(asset, ct)) return Failure<MediaAssetDto>(ErrorCode.RateLimited);
            await storage.PutAsync(asset.ObjectKey, image.Bytes, image.ContentType, ct);
            await repository.MarkReadyAsync(asset, ct);
            return Result<MediaAssetDto>.Success(ToDto(asset));
        }
        catch (InvalidMediaException) { return Failure<MediaAssetDto>(ErrorCode.ValidationFailed); }
        catch (MediaUnavailableException) { return Failure<MediaAssetDto>(ErrorCode.Unavailable); }
    }

    public async Task<Result<bool>> SaveAsync(Guid tenantId, string slot, Guid? candidateId, Guid? expectedId,
        ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanManageAsync(tenantId, identity, ct)) return Failure<bool>(ErrorCode.NotFound);
        if (!MediaAsset.IsSlot(slot)) return Failure<bool>(ErrorCode.ValidationFailed);
        if (candidateId is not null)
        {
            var draft = await repository.FindAsync(tenantId, candidateId.Value, ct);
            if (draft is null || draft.Slot != slot || !draft.IsReady || draft.WasPublished ||
                draft.ExpiresAt <= clock.GetUtcNow()) return Failure<bool>(ErrorCode.NotFound);
            try { await storage.GetAsync(draft.ObjectKey, ct); }
            catch (MediaUnavailableException) { return Failure<bool>(ErrorCode.Unavailable); }
        }
        return await repository.SetActiveAsync(tenantId, slot, candidateId, expectedId, clock.GetUtcNow(), ct)
            ? Result<bool>.Success(true) : Failure<bool>(ErrorCode.PreconditionFailed);
    }

    public async Task<Result<MediaContent>> PreviewAsync(Guid tenantId, Guid id, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await CanManageAsync(tenantId, identity, ct)) return Failure<MediaContent>(ErrorCode.NotFound);
        var asset = await repository.FindAsync(tenantId, id, ct);
        return await ReadAsync(asset, ct);
    }

    public async Task<Result<MediaContent>> PublicAsync(Guid tenantId, string slot, CancellationToken ct)
    {
        var asset = (await repository.ActiveAsync(tenantId, ct)).SingleOrDefault(item => item.Slot == slot);
        return await ReadAsync(asset, ct);
    }

    private async Task<Result<MediaContent>> ReadAsync(MediaAsset? asset, CancellationToken ct)
    {
        if (asset is null || !asset.IsReady || asset.ExpiresAt <= clock.GetUtcNow()) return Failure<MediaContent>(ErrorCode.NotFound);
        try { return Result<MediaContent>.Success(new(await storage.GetAsync(asset.ObjectKey, ct), asset.ContentType)); }
        catch (MediaUnavailableException) { return Failure<MediaContent>(ErrorCode.Unavailable); }
    }

    private static MediaAssetDto ToDto(MediaAsset asset) => new(asset.Id, asset.Slot, asset.ContentType,
        asset.Width, asset.Height, asset.Bytes);
    private static Result<T> Failure<T>(ErrorCode code) => Result<T>.Failure(new ApplicationError(code));
}
