namespace WhitePlate.Api.Contracts;

public sealed record UpdateLegalProfileRequest(string? LegalCountryCode, string? LegalName,
    string? LegalRegistrationNumber, string? TaxIdentifier);

public sealed record UpdateTenantLegalProfileRequest(string Mode, string? LegalCountryCode = null,
    string? LegalName = null, string? LegalRegistrationNumber = null, string? TaxIdentifier = null);
