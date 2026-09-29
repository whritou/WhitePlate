namespace WhitePlate.Application.Organizations;

public sealed record ProvisionOrganizationCommand(string Name, string Issuer, string Subject);
