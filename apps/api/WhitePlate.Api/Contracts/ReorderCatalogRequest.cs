namespace WhitePlate.Api.Contracts;

public sealed record ReorderCatalogRequest(string EntityType, Guid? ParentId, Guid? CategoryId,
    IReadOnlyList<Guid> OrderedIds);
