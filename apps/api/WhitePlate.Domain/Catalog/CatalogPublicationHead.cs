using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public sealed class CatalogPublicationHead
{
    public Guid TenantId { get; private set; }
    public int PublishedVersion { get; private set; }
    public string SnapshotJson { get; private set; } = null!;
    public DateTimeOffset UpdatedAt { get; private set; }

    private CatalogPublicationHead() { }

    public static CatalogPublicationHead Create(Guid tenantId, int version, string snapshotJson,
        DateTimeOffset updatedAt)
    {
        if (tenantId == Guid.Empty || version < 1 || string.IsNullOrWhiteSpace(snapshotJson))
            throw new DomainRuleException("invalid_catalog_publication", "catalog", "A published catalog snapshot is required.");

        return new CatalogPublicationHead
        {
            TenantId = tenantId,
            PublishedVersion = version,
            SnapshotJson = snapshotJson,
            UpdatedAt = updatedAt.ToUniversalTime()
        };
    }

    public bool Advance(int expectedVersion, string snapshotJson, DateTimeOffset updatedAt)
    {
        if (PublishedVersion != expectedVersion || PublishedVersion == int.MaxValue)
            return false;
        if (string.IsNullOrWhiteSpace(snapshotJson))
            throw new DomainRuleException("invalid_catalog_publication", "catalog", "A published catalog snapshot is required.");

        PublishedVersion++;
        SnapshotJson = snapshotJson;
        UpdatedAt = updatedAt.ToUniversalTime();
        return true;
    }
}
