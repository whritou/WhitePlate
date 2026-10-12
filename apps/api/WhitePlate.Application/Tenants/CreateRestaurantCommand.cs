using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Tenants;

public sealed record CreateRestaurantCommand(Guid OrganizationId, string Name, string Subdomain, string Currency,
    ExternalIdentity Identity, string LegalProfileMode = "inherit", string? LegalCountryCode = null,
    string? LegalName = null, string? LegalRegistrationNumber = null, string? TaxIdentifier = null);
