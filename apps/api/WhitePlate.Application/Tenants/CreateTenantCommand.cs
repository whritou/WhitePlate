namespace WhitePlate.Application.Tenants;

// Administrative capability; deliberately not exposed through an anonymous HTTP route.
public sealed record CreateTenantCommand(Guid OrganizationId, string Name, string Subdomain, string Currency);
