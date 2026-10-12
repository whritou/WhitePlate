using WhitePlate.Domain.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Tenants;

public sealed record PublicEstablishmentDto(string Name, string? Phone, string? AddressLine1, string? AddressLine2,
    string? PostalCode, string? City, string? Region, string? CountryCode, decimal? Latitude, decimal? Longitude,
    string TimeZone, string? PickupInstruction, string? PickupLocale, OpeningHoursSchedule? OpeningHours)
{
    public static PublicEstablishmentDto FromTenant(Tenant tenant, string? locale)
    {
        var pickup = tenant.ResolvePickupInstructions(locale);
        return new(tenant.Name, tenant.Phone, tenant.AddressLine1, tenant.AddressLine2, tenant.PostalCode,
            tenant.City, tenant.Region, tenant.CountryCode, tenant.Latitude, tenant.Longitude, tenant.TimeZone,
            pickup.Text, pickup.Locale, tenant.GetOpeningHours());
    }
}

public sealed record EstablishmentSettingsDto(string Name, string? Phone, string? AddressLine1, string? AddressLine2,
    string? PostalCode, string? City, string? Region, string? CountryCode, decimal? Latitude, decimal? Longitude,
    string TimeZone, IReadOnlyDictionary<string, string> PickupInstructions, int EstablishmentVersion,
    IReadOnlyList<string> Locales, string DefaultLocale, OpeningHoursSchedule? OpeningHours,
    PickupSchedulingSettings PickupScheduling)
{
    public static EstablishmentSettingsDto FromTenant(Tenant tenant) => new(tenant.Name, tenant.Phone,
        tenant.AddressLine1, tenant.AddressLine2, tenant.PostalCode, tenant.City, tenant.Region, tenant.CountryCode,
        tenant.Latitude, tenant.Longitude, tenant.TimeZone, tenant.GetPickupInstructions(), tenant.EstablishmentVersion,
        tenant.GetMenuLocales(), tenant.DefaultMenuLocale, tenant.GetOpeningHours(), tenant.GetPickupScheduling());
}

public sealed record EstablishmentOptionsDto(IReadOnlyList<string> TimeZones, IReadOnlyList<string> Countries);

public sealed record LegalProfileValuesDto(string? CountryCode, string? Name, string? RegistrationNumber,
    string? TaxIdentifier);

public sealed record TenantLegalProfileDto(string Mode, LegalProfileValuesDto OrganizationProfile,
    LegalProfileValuesDto EffectiveProfile, int Version)
{
    public static TenantLegalProfileDto From(Tenant tenant, Organization? organization)
    {
        var parent = new LegalProfileValuesDto(organization?.LegalCountryCode, organization?.LegalName,
            organization?.LegalRegistrationNumber, organization?.TaxIdentifier);
        var effective = tenant.LegalProfileMode == "custom"
            ? new LegalProfileValuesDto(tenant.LegalCountryCode, tenant.LegalName,
                tenant.LegalRegistrationNumber, tenant.TaxIdentifier)
            : parent;
        return new(tenant.LegalProfileMode, parent, effective, tenant.LegalProfileVersion);
    }
}

public sealed record UpdateTenantLegalProfileInput(string Mode, string? CountryCode, string? Name,
    string? RegistrationNumber, string? TaxIdentifier);

public interface IEstablishmentOptions
{
    EstablishmentOptionsDto Get();
}

public interface IEstablishmentSettingsRepository
{
    Task<Tenant?> GetAsync(Guid tenantId, CancellationToken cancellationToken);
    Task<Organization?> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, string expectedLocales, string expectedDefaultLocale,
        CancellationToken cancellationToken);
    Task<bool> SaveLegalProfileAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion,
        CancellationToken cancellationToken);
}
