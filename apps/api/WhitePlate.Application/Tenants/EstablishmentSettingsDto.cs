using WhitePlate.Domain.Tenants;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Tenants;

public sealed record PublicEstablishmentDto(string Name, string? Phone, string? AddressLine1, string? AddressLine2,
    string? PostalCode, string? City, string? Region, string? CountryCode, decimal? Latitude, decimal? Longitude,
    string TimeZone, string? PickupInstruction, string? PickupLocale)
{
    public static PublicEstablishmentDto FromTenant(Tenant tenant, string? locale)
    {
        var pickup = tenant.ResolvePickupInstructions(locale);
        return new(tenant.Name, tenant.Phone, tenant.AddressLine1, tenant.AddressLine2, tenant.PostalCode,
            tenant.City, tenant.Region, tenant.CountryCode, tenant.Latitude, tenant.Longitude, tenant.TimeZone,
            pickup.Text, pickup.Locale);
    }
}

public sealed record EstablishmentSettingsDto(string Name, string? Phone, string? AddressLine1, string? AddressLine2,
    string? PostalCode, string? City, string? Region, string? CountryCode, decimal? Latitude, decimal? Longitude,
    string TimeZone, IReadOnlyDictionary<string, string> PickupInstructions, int EstablishmentVersion,
    IReadOnlyList<string> Locales, string DefaultLocale)
{
    public static EstablishmentSettingsDto FromTenant(Tenant tenant) => new(tenant.Name, tenant.Phone,
        tenant.AddressLine1, tenant.AddressLine2, tenant.PostalCode, tenant.City, tenant.Region, tenant.CountryCode,
        tenant.Latitude, tenant.Longitude, tenant.TimeZone, tenant.GetPickupInstructions(), tenant.EstablishmentVersion,
        tenant.GetMenuLocales(), tenant.DefaultMenuLocale);
}

public sealed record EstablishmentOptionsDto(IReadOnlyList<string> TimeZones, IReadOnlyList<string> Countries);

public interface IEstablishmentOptions
{
    EstablishmentOptionsDto Get();
}

public interface IEstablishmentSettingsRepository
{
    Task<Tenant?> GetAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, string expectedLocales, string expectedDefaultLocale,
        CancellationToken cancellationToken);
}
