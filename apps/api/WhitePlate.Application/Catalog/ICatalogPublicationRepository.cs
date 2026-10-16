using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public interface ICatalogPublicationRepository
{
    Task<PublishedCatalogSnapshot?> GetPublishedCatalogAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<CatalogPublicationSummaryDto?> GetSummaryAsync(Guid tenantId, PublishedCatalogSnapshot draft,
        CancellationToken cancellationToken);
    Task<CatalogHistoryDto?> GetHistoryAsync(Guid tenantId, int? beforeVersion, int pageSize,
        CancellationToken cancellationToken);
    Task<Result<CatalogPublicationResultDto>> PublishAsync(Guid tenantId, int expectedVersion,
        ExternalIdentity identity, CancellationToken cancellationToken);
    Task<Result<bool>> DiscardAsync(Guid tenantId, int expectedVersion, CancellationToken cancellationToken);
    Task<Result<CatalogPublicationResultDto>> RestoreAsync(Guid tenantId, int expectedVersion,
        int sourceVersion, ExternalIdentity identity, CancellationToken cancellationToken);
    Task<bool> SetProductAvailabilityAsync(Guid tenantId, Guid productId, bool isAvailable,
        ExternalIdentity identity, CancellationToken cancellationToken);
}
