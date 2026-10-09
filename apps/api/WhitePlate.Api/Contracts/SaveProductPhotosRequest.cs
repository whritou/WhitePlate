namespace WhitePlate.Api.Contracts;

public sealed record SaveProductPhotosRequest(IReadOnlyList<Guid>? AssetIds, IReadOnlyList<Guid>? ExpectedIds);
