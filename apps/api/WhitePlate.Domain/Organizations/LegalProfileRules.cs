using System.Text.RegularExpressions;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Organizations;

public static partial class LegalProfileRules
{
    private static readonly HashSet<string> SupportedCountries = new(StringComparer.Ordinal)
        { "FR", "DE", "GB", "US" };

    public static (string Country, string? Name, string? Registration, string? Tax, string? Establishment)
        Normalize(string? country, string? name, string? registration, string? tax, string? establishment,
            bool restaurant = false)
    {
        country = country?.Trim().ToUpperInvariant();
        name = NormalizeText(name, "legalName", 200);
        registration = NormalizeText(registration, "legalRegistrationNumber", 32);
        tax = NormalizeText(tax, "taxIdentifier", 32)?.Replace(" ", "", StringComparison.Ordinal)
            .ToUpperInvariant();
        establishment = NormalizeText(establishment, "establishmentRegistrationNumber", 32);

        if (country is null || !SupportedCountries.Contains(country)) Invalid("legalCountryCode");
        var normalizedCountry = country!;
        if (registration is not null && !(restaurant && normalizedCountry == "FR"
                ? IsValidSiret(registration)
                : IsValidRegistration(normalizedCountry, registration))) Invalid("legalRegistrationNumber");
        if (establishment is not null && (country != "FR" || !IsValidSiret(establishment)))
            Invalid("establishmentRegistrationNumber");
        if (tax is not null && !IsValidTaxIdentifier(normalizedCountry, tax)) Invalid("taxIdentifier");

        return (normalizedCountry, name, registration, tax, establishment);
    }

    private static bool IsValidRegistration(string country, string value) => country switch
    {
        "FR" => IsValidSiren(value),
        "DE" => Regex.IsMatch(value, "^[A-Za-z0-9 /-]{2,32}$", RegexOptions.CultureInvariant),
        "GB" => UkCompanyNumberRegex().IsMatch(value),
        "US" => EinRegex().IsMatch(value),
        _ => false
    };

    private static bool IsValidTaxIdentifier(string country, string value) => country switch
    {
        "FR" => Regex.IsMatch(value, "^FR[A-Z0-9]{11}$", RegexOptions.CultureInvariant),
        "DE" => Regex.IsMatch(value, "^DE[0-9]{9}$", RegexOptions.CultureInvariant),
        "GB" => Regex.IsMatch(value, "^GB(?:[0-9]{9}(?:[0-9]{3})?|GD[0-9]{3}|HA[0-9]{3})$", RegexOptions.CultureInvariant),
        "US" => EinRegex().IsMatch(value),
        _ => false
    };

    private static bool IsValidSiren(string value) => value.Length == 9 && value.All(char.IsAsciiDigit) &&
        HasLuhnCheckDigit(value);

    private static bool IsValidSiret(string value) => value.Length == 14 && value.All(char.IsAsciiDigit) &&
        HasLuhnCheckDigit(value);

    private static bool HasLuhnCheckDigit(string value)
    {
        var sum = 0;
        for (var index = 0; index < value.Length; index++)
        {
            var digit = value[index] - '0';
            if ((value.Length - index) % 2 == 0)
            {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
        }

        return sum % 10 == 0;
    }

    private static string? NormalizeText(string? value, string field, int maxLength)
    {
        var normalized = value?.Trim();
        if (normalized?.Length > maxLength) Invalid(field);
        return string.IsNullOrEmpty(normalized) ? null : normalized;
    }

    private static void Invalid(string field) => throw new DomainRuleException("invalid_legal_profile", field,
        "The legal profile field is invalid.");

    [GeneratedRegex("^(?:[0-9]{1,8}|[A-Z]{2}[A-Z0-9]{1,6})$", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex UkCompanyNumberRegex();

    [GeneratedRegex("^[0-9]{2}-?[0-9]{7}$", RegexOptions.CultureInvariant)]
    private static partial Regex EinRegex();
}
