namespace WhitePlate.Api.Contracts;

public sealed record CreateOrganizationRoleRequest(string Name, IReadOnlyList<string> Permissions);
