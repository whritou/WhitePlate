namespace WhitePlate.Api.Contracts;

public sealed record CreateRestaurantRequest(string Name, string Subdomain, string Currency,
    string LegalProfileMode = "inherit", string? LegalCountryCode = null, string? LegalName = null,
    string? LegalRegistrationNumber = null, string? TaxIdentifier = null);
