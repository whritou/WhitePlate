using System.Text.Json;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed record EstablishmentInput(string? Name, string? Phone = null, string? AddressLine1 = null,
    string? AddressLine2 = null, string? PostalCode = null, string? City = null, string? Region = null,
    string? CountryCode = null, decimal? Latitude = null, decimal? Longitude = null, string? TimeZone = "UTC",
    IReadOnlyDictionary<string, string?>? PickupInstructions = null);

public sealed partial class Tenant
{
    public string? Phone { get; private set; }
    public string? AddressLine1 { get; private set; }
    public string? AddressLine2 { get; private set; }
    public string? PostalCode { get; private set; }
    public string? City { get; private set; }
    public string? Region { get; private set; }
    public string? CountryCode { get; private set; }
    public decimal? Latitude { get; private set; }
    public decimal? Longitude { get; private set; }
    public string TimeZone { get; private set; } = "UTC";
    public string PickupInstructionsJson { get; private set; } = "{}";
    public int EstablishmentVersion { get; private set; } = 1;

    public void UpdateEstablishment(EstablishmentInput input)
    {
        var name = Normalize(input.Name, "name", MaxNameLength);
        if (name is null) Invalid("name");
        var phone = Normalize(input.Phone, "phone", 40);
        if (phone is not null && (phone.Any(c => !char.IsAsciiDigit(c) && !" +-().".Contains(c)) ||
            phone.Count(char.IsAsciiDigit) is < 3 or > 20)) Invalid("phone");
        var line1 = Normalize(input.AddressLine1, "addressLine1", 200);
        var line2 = Normalize(input.AddressLine2, "addressLine2", 200);
        var postal = Normalize(input.PostalCode, "postalCode", 20);
        var city = Normalize(input.City, "city", 100);
        var region = Normalize(input.Region, "region", 100);
        var country = Normalize(input.CountryCode, "countryCode", 2)?.ToUpperInvariant();
        if (country is not null && (country.Length != 2 || country.Any(c => c is < 'A' or > 'Z'))) Invalid("countryCode");
        if (new[] { line1, line2, postal, city, region, country }.Any(value => value is not null))
        {
            if (line1 is null) Invalid("addressLine1");
            if (city is null) Invalid("city");
            if (country is null) Invalid("countryCode");
        }
        if (input.Latitude.HasValue != input.Longitude.HasValue || input.Latitude is < -90 or > 90 ||
            input.Longitude is < -180 or > 180) Invalid("latitude");
        var zone = Normalize(input.TimeZone, "timeZone", 100);
        if (zone is null) Invalid("timeZone");
        if (EstablishmentVersion == int.MaxValue) Invalid("establishmentVersion");
        var translations = ReadPickupInstructions();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (locale, text) in input.PickupInstructions ?? new Dictionary<string, string?>())
        {
            var normalized = MenuLocale.Create(locale).Value;
            if (!SupportsMenuLocale(normalized) || !seen.Add(normalized)) Invalid("pickupInstructions");
            var value = Normalize(text, "pickupInstructions", 1000);
            if (value is null) translations.Remove(normalized);
            else translations[normalized] = value;
        }
        Name = name!;
        Phone = phone;
        AddressLine1 = line1;
        AddressLine2 = line2;
        PostalCode = postal;
        City = city;
        Region = region;
        CountryCode = country;
        Latitude = input.Latitude is { } latitude ? decimal.Round(latitude, 6) : null;
        Longitude = input.Longitude is { } longitude ? decimal.Round(longitude, 6) : null;
        TimeZone = zone!;
        PickupInstructionsJson = JsonSerializer.Serialize(translations);
        EstablishmentVersion++;
    }

    public IReadOnlyDictionary<string, string> GetPickupInstructions() => ReadPickupInstructions()
        .Where(pair => SupportsMenuLocale(pair.Key)).ToDictionary(pair => pair.Key, pair => pair.Value);

    public (string? Text, string? Locale) ResolvePickupInstructions(string? locale)
    {
        var values = ReadPickupInstructions();
        var effective = MenuLocale.TryCreate(locale, out var normalized) && SupportsMenuLocale(normalized!.Value)
            ? normalized.Value : DefaultMenuLocale;
        if (values.TryGetValue(effective, out var text)) return (text, effective);
        return values.TryGetValue(DefaultMenuLocale, out text) ? (text, DefaultMenuLocale) : (null, null);
    }

    private Dictionary<string, string> ReadPickupInstructions() => new(
        JsonSerializer.Deserialize<Dictionary<string, string>>(PickupInstructionsJson) ?? [], StringComparer.OrdinalIgnoreCase);

    private static string? Normalize(string? value, string field, int limit)
    {
        var normalized = value?.Trim();
        if (normalized?.Length > limit) Invalid(field);
        return string.IsNullOrEmpty(normalized) ? null : normalized;
    }

    private static void Invalid(string field) => throw new DomainRuleException("invalid_establishment", field,
        "The establishment field is invalid or incomplete.");
}
