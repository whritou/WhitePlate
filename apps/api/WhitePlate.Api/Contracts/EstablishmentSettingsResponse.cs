using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Api.Contracts;

public sealed record EstablishmentSettingsResponse(string Name, string? Phone, string? AddressLine1, string? AddressLine2,
    string? PostalCode, string? City, string? Region, string? CountryCode, decimal? Latitude, decimal? Longitude,
    string TimeZone, IReadOnlyDictionary<string, string> PickupInstructions, int EstablishmentVersion,
    IReadOnlyList<string> Locales, string DefaultLocale, OpeningHoursSchedule? OpeningHours,
    PickupSchedulingSettings PickupScheduling)
{
    public static EstablishmentSettingsResponse FromDto(EstablishmentSettingsDto value) => new(value.Name, value.Phone,
        value.AddressLine1, value.AddressLine2, value.PostalCode, value.City, value.Region, value.CountryCode,
        value.Latitude, value.Longitude, value.TimeZone, value.PickupInstructions, value.EstablishmentVersion,
        value.Locales, value.DefaultLocale, value.OpeningHours, value.PickupScheduling);
}

public sealed record EstablishmentOptionsResponse(IReadOnlyList<string> TimeZones, IReadOnlyList<string> Countries);

public sealed record PublicEstablishmentResponse(string Name, string? Phone, string? AddressLine1, string? AddressLine2,
    string? PostalCode, string? City, string? Region, string? CountryCode, decimal? Latitude, decimal? Longitude,
    string TimeZone, string? PickupInstruction, string? PickupLocale, OpeningHoursSchedule? OpeningHours)
{
    public static PublicEstablishmentResponse FromDto(PublicEstablishmentDto value) => new(value.Name, value.Phone,
        value.AddressLine1, value.AddressLine2, value.PostalCode, value.City, value.Region, value.CountryCode,
        value.Latitude, value.Longitude, value.TimeZone, value.PickupInstruction, value.PickupLocale, value.OpeningHours);
}

public sealed record UpdateOpeningHoursRequest(OpeningHoursSchedule? OpeningHours);
public sealed record UpdatePickupSchedulingRequest(int IntervalMinutes, int MinimumLeadMinutes, int Capacity);
