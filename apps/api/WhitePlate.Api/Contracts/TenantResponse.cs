namespace WhitePlate.Api.Contracts;

public sealed record TenantResponse(Guid Id, string Name, string Subdomain, string Currency);
