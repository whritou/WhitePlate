using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public sealed class CatalogRevision
{
    public Guid TenantId { get; private set; }
    public int Version { get; private set; }
    public string SnapshotJson { get; private set; } = null!;
    public string ChangeSetJson { get; private set; } = "[]";
    public string Action { get; private set; } = null!;
    public int? SourceVersion { get; private set; }
    public string ActorIssuer { get; private set; } = null!;
    public string ActorSubject { get; private set; } = null!;
    public DateTimeOffset PublishedAt { get; private set; }

    private CatalogRevision() { }

    public static CatalogRevision Create(Guid tenantId, int version, string snapshotJson,
        string changeSetJson, string action, int? sourceVersion, string actorIssuer, string actorSubject,
        DateTimeOffset publishedAt)
    {
        if (tenantId == Guid.Empty || version < 1 || string.IsNullOrWhiteSpace(snapshotJson) ||
            string.IsNullOrWhiteSpace(changeSetJson) || string.IsNullOrWhiteSpace(actorIssuer) ||
            string.IsNullOrWhiteSpace(actorSubject) || action is not ("baseline" or "publish" or "rollback" or "availability"))
            throw new DomainRuleException("invalid_catalog_revision", "catalog", "The catalog revision is invalid.");
        if (sourceVersion is < 1)
            throw new DomainRuleException("invalid_catalog_revision", "sourceVersion", "The source catalog version is invalid.");

        return new CatalogRevision
        {
            TenantId = tenantId,
            Version = version,
            SnapshotJson = snapshotJson,
            ChangeSetJson = changeSetJson,
            Action = action,
            SourceVersion = sourceVersion,
            ActorIssuer = actorIssuer,
            ActorSubject = actorSubject,
            PublishedAt = publishedAt.ToUniversalTime()
        };
    }
}
