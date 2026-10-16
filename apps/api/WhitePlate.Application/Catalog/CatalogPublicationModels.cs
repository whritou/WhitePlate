namespace WhitePlate.Application.Catalog;

public sealed record PublishedCatalogSnapshot(Guid TenantId, string Currency, string DefaultLocale,
    IReadOnlyList<string> Locales, IReadOnlyList<CatalogCategoryAdminDto> Categories,
    IReadOnlyList<CatalogProductAdminDto> Products, IReadOnlyList<CatalogOptionGroupAdminDto> OptionGroups,
    IReadOnlyList<CatalogOptionAdminDto> Options, IReadOnlyList<PromotionDiscountDto> Discounts);

public sealed record CatalogFieldChangeDto(string Field, string? Before, string? After);
public sealed record CatalogChangeDto(string EntityType, Guid EntityId, string Name, string Action,
    IReadOnlyList<CatalogFieldChangeDto> Fields);
public sealed record CatalogPublicationSummaryDto(int PublishedVersion, DateTimeOffset PublishedAt,
    bool HasUnpublishedChanges, int ChangeCount, IReadOnlyList<CatalogChangeDto> Changes);
public sealed record CatalogHistoryRevisionDto(int Version, DateTimeOffset PublishedAt, string Action,
    int? SourceVersion, string ActorIssuer, string ActorSubject, IReadOnlyList<CatalogChangeDto> Changes);
public sealed record CatalogHistoryDto(int CurrentVersion, IReadOnlyList<CatalogHistoryRevisionDto> Revisions);
public sealed record CatalogPublicationResultDto(int PublishedVersion, DateTimeOffset PublishedAt);
public sealed record CatalogRevisionRecord(int Version, string SnapshotJson, string ChangeSetJson,
    string Action, int? SourceVersion, string ActorIssuer, string ActorSubject, DateTimeOffset PublishedAt);
public sealed record CatalogPublicationRecord(int Version, string SnapshotJson, DateTimeOffset UpdatedAt);
