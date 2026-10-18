namespace WhitePlate.Api.Contracts;

public sealed record UpdateOrganizationRoleGrantsRequest(string Role, IReadOnlyList<string> Permissions, int Version,
    string? Name = null);
