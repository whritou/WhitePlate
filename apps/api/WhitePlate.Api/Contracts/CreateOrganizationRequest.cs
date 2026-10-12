namespace WhitePlate.Api.Contracts;

public sealed record CreateOrganizationRequest(string Name, string LegalCountryCode, string? LegalName = null,
    string? LegalRegistrationNumber = null, string? TaxIdentifier = null);
