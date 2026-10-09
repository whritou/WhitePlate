using WhitePlate.Domain.Media;

namespace WhitePlate.Application.Media;

public sealed record MediaAssetDto(Guid Id, string Slot, string ContentType, int Width, int Height, long Bytes);
public sealed record BrandAssetsDto(bool StorageAvailable, IReadOnlyList<MediaAssetDto> Assets);
public sealed record NormalizedImage(byte[] Bytes, string ContentType, int Width, int Height);
public sealed record MediaContent(byte[] Bytes, string ContentType);
public sealed record ProductPhotoDto(Guid Id, int Width, int Height, long Bytes);
public sealed record ProductPhotosDto(bool StorageAvailable, IReadOnlyList<ProductPhotoDto> Assets);
public interface IProductImageProcessor
{
    Task<IReadOnlyDictionary<int, NormalizedImage>> NormalizeAsync(string aspect, byte[] bytes, CancellationToken ct);
}
public interface IProductPhotoRepository
{
    Task<bool> ProductExistsAsync(Guid tenantId, Guid productId, bool writable, CancellationToken ct);
    Task<bool> PublicProductExistsAsync(Guid tenantId, Guid productId, CancellationToken ct);
    Task<IReadOnlyList<MediaAsset>> ListAsync(Guid tenantId, Guid productId, CancellationToken ct);
    Task<bool> SaveAsync(Guid tenantId, Guid productId, IReadOnlyList<Guid> ids,
        IReadOnlyList<Guid> expectedIds, DateTimeOffset now, CancellationToken ct);
}
public sealed class MediaUnavailableException : Exception;
public sealed class InvalidMediaException : Exception;

public interface IMediaStorage
{
    bool IsAvailable { get; }
    Task PutAsync(string key, byte[] bytes, string contentType, CancellationToken cancellationToken);
    Task<byte[]> GetAsync(string key, CancellationToken cancellationToken);
    Task DeleteAsync(string key, CancellationToken cancellationToken);
}

public interface IMediaImageProcessor
{
    Task<NormalizedImage> NormalizeAsync(string slot, string aspect, byte[] bytes, CancellationToken cancellationToken);
}

public interface IMediaRepository
{
    Task<IReadOnlyList<MediaAsset>> ActiveAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<MediaAsset?> FindAsync(Guid tenantId, Guid id, CancellationToken cancellationToken);
    Task<bool> AddPendingAsync(MediaAsset asset, CancellationToken cancellationToken);
    Task MarkReadyAsync(MediaAsset asset, CancellationToken cancellationToken);
    Task<bool> SetActiveAsync(Guid tenantId, string slot, Guid? candidateId, Guid? expectedId,
        DateTimeOffset now, CancellationToken cancellationToken);
}
