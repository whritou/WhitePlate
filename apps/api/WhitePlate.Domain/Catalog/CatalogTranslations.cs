using System.Text.Json;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Domain.Catalog;

public sealed record CatalogLocalizedText(string Name, string? Description = null);

public static class CatalogTranslations
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string Set(string? json, string? locale, string? name, string? description,
        int maxNameLength, int maxDescriptionLength = 0)
    {
        var normalizedLocale = MenuLocale.Create(locale).Value;
        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > maxNameLength)
            throw new WhitePlate.Domain.Common.DomainRuleException("invalid_name", "name",
                $"Name must contain 1 to {maxNameLength} characters.");
        var normalizedDescription = description?.Trim();
        if (maxDescriptionLength == 0 && !string.IsNullOrEmpty(normalizedDescription))
            throw new WhitePlate.Domain.Common.DomainRuleException("invalid_description", "description",
                "A description is not supported for this catalog item.");
        if (normalizedDescription?.Length > maxDescriptionLength && maxDescriptionLength > 0)
            throw new WhitePlate.Domain.Common.DomainRuleException("invalid_description", "description",
                $"Description cannot exceed {maxDescriptionLength} characters.");

        var translations = Read(json);
        translations[normalizedLocale] = new CatalogLocalizedText(normalizedName,
            string.IsNullOrEmpty(normalizedDescription) ? null : normalizedDescription);
        return JsonSerializer.Serialize(translations, JsonOptions);
    }

    public static CatalogLocalizedText Get(string? json, string locale, string defaultLocale,
        string name, string? description = null)
    {
        var translations = Read(json);
        if (translations.TryGetValue(MenuLocale.Create(locale).Value, out var requested)) return requested;
        if (translations.TryGetValue(MenuLocale.Create(defaultLocale).Value, out var fallback)) return fallback;
        return new CatalogLocalizedText(name, description);
    }

    public static IReadOnlyDictionary<string, CatalogLocalizedText> GetAll(string? json) => Read(json);

    public static bool HasTranslation(string? json, string? locale) =>
        MenuLocale.TryCreate(locale, out var normalizedLocale) &&
        Read(json).ContainsKey(normalizedLocale!.Value);

    private static Dictionary<string, CatalogLocalizedText> Read(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new Dictionary<string, CatalogLocalizedText>(StringComparer.OrdinalIgnoreCase);
        return JsonSerializer.Deserialize<Dictionary<string, CatalogLocalizedText>>(json, JsonOptions) ??
               new Dictionary<string, CatalogLocalizedText>(StringComparer.OrdinalIgnoreCase);
    }
}
