using WhitePlate.Domain.Tenants;

namespace WhitePlate.Api.Contracts;

public sealed record UpdateEstablishmentSettingsRequest(string? Name, string? Phone, string? AddressLine1,
    string? AddressLine2, string? PostalCode, string? City, string? Region, string? CountryCode,
    decimal? Latitude, decimal? Longitude, string? TimeZone, Dictionary<string, string?>? PickupInstructions)
{
    public EstablishmentInput ToInput() => new(Name, Phone, AddressLine1, AddressLine2, PostalCode, City,
        Region, CountryCode, Latitude, Longitude, TimeZone, PickupInstructions);
}
