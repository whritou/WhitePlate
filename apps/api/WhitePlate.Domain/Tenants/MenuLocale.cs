using System.Text.RegularExpressions;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed partial record MenuLocale
{
    public string Value { get; }

    private MenuLocale(string value) => Value = value;

    public static bool TryCreate(string? value, out MenuLocale? locale)
    {
        var normalized = value?.Trim();
        if (normalized is null || normalized.Length > 128 || !LocalePattern().IsMatch(normalized))
        {
            locale = null;
            return false;
        }

        var parts = normalized.Split('-');
        for (var index = 0; index < parts.Length; index++)
        {
            parts[index] = index == 0 ? parts[index].ToLowerInvariant() :
                parts[index].Length == 4 && parts[index].All(char.IsLetter)
                    ? char.ToUpperInvariant(parts[index][0]) + parts[index][1..].ToLowerInvariant()
                    : parts[index].Length == 2 && parts[index].All(char.IsLetter)
                        ? parts[index].ToUpperInvariant()
                        : parts[index].ToLowerInvariant();
        }

        locale = new MenuLocale(string.Join('-', parts));
        return true;
    }

    public static MenuLocale Create(string? value) => TryCreate(value, out var locale)
        ? locale!
        : throw new DomainRuleException("invalid_menu_locale", "locale",
            "Use a valid language tag such as en, fr, or zh-Hant-TW.");

    [GeneratedRegex("^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$", RegexOptions.CultureInvariant)]
    private static partial Regex LocalePattern();
}
