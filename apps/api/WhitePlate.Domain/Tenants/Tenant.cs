using WhitePlate.Domain.Common;
using System.Text.Json;

namespace WhitePlate.Domain.Tenants;

public sealed class Tenant
{
    public const int MaxNameLength = 200;
    public const int MaxDescriptionLength = 500;
    private static readonly HashSet<string> SupportedCurrencies = new(StringComparer.Ordinal)
    {
        "EUR", "GBP", "USD"
    };

    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public string Name { get; private set; } = null!;
    public TenantSubdomain Subdomain { get; private set; } = null!;
    public string Currency { get; private set; } = null!;
    public bool IsActive { get; private set; }
    public string DefaultMenuLocale { get; private set; } = "en";
    public string MenuLocalesJson { get; private set; } = "[\"en\"]";
    public string DescriptionTranslationsJson { get; private set; } = "{}";

    private Tenant() { }

    public static Tenant Create(Guid organizationId, string? name, string? subdomain, string? currency)
    {
        if (organizationId == Guid.Empty)
        {
            throw new DomainRuleException("invalid_organization", "organizationId", "An organization is required.");
        }

        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > MaxNameLength)
        {
            throw new DomainRuleException("invalid_name", "name", "Tenant name must contain 1 to 200 characters.");
        }

        var normalizedCurrency = currency?.Trim().ToUpperInvariant();
        if (normalizedCurrency is null || !SupportedCurrencies.Contains(normalizedCurrency))
        {
            throw new DomainRuleException("invalid_currency", "currency", "Currency must be EUR, GBP, or USD.");
        }

        return new Tenant
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Name = normalizedName,
            Subdomain = TenantSubdomain.Create(subdomain),
            Currency = normalizedCurrency,
            IsActive = true
        };
    }

    public void Deactivate() => IsActive = false;

    public IReadOnlyList<string> GetMenuLocales() =>
        JsonSerializer.Deserialize<string[]>(MenuLocalesJson) ?? [DefaultMenuLocale];

    public bool SupportsMenuLocale(string? locale)
    {
        if (!MenuLocale.TryCreate(locale, out var normalized)) return false;
        return GetMenuLocales().Contains(normalized!.Value, StringComparer.OrdinalIgnoreCase);
    }

    public void UpdateMenuLocales(IEnumerable<string>? locales, string? defaultLocale)
    {
        var values = locales?.Select(MenuLocale.Create).Select(locale => locale.Value).ToArray() ?? [];
        var normalizedDefault = MenuLocale.Create(defaultLocale).Value;
        if (values.Length == 0)
            throw new DomainRuleException("menu_locale_required", "locales", "At least one menu language is required.");
        if (values.Distinct(StringComparer.OrdinalIgnoreCase).Count() != values.Length)
            throw new DomainRuleException("duplicate_menu_locale", "locales", "Menu languages must be unique.");
        if (!values.Contains(normalizedDefault, StringComparer.OrdinalIgnoreCase))
            throw new DomainRuleException("default_menu_locale_required", "defaultLocale",
                "The default menu language must be one of the enabled languages.");

        DefaultMenuLocale = normalizedDefault;
        MenuLocalesJson = JsonSerializer.Serialize(values);
    }

    public void SetDescriptionTranslation(string? locale, string? description)
    {
        var normalizedLocale = MenuLocale.Create(locale).Value;
        if (!SupportsMenuLocale(normalizedLocale))
            throw new DomainRuleException("unsupported_menu_locale", "locale",
                "Enable this language in the restaurant menu settings before adding its description.");

        var normalizedDescription = description?.Trim();
        if (normalizedDescription?.Length > MaxDescriptionLength)
            throw new DomainRuleException("invalid_description", "description",
                $"Description cannot exceed {MaxDescriptionLength} characters.");

        var translations = ReadDescriptionTranslations();
        if (string.IsNullOrEmpty(normalizedDescription)) translations.Remove(normalizedLocale);
        else translations[normalizedLocale] = normalizedDescription;
        DescriptionTranslationsJson = JsonSerializer.Serialize(translations);
    }

    public string? ResolveDescription(string? locale)
    {
        var translations = ReadDescriptionTranslations();
        var requestedLocale = MenuLocale.TryCreate(locale, out var normalizedLocale) &&
                              SupportsMenuLocale(normalizedLocale!.Value)
            ? normalizedLocale.Value
            : DefaultMenuLocale;

        return translations.GetValueOrDefault(requestedLocale) ??
               translations.GetValueOrDefault(DefaultMenuLocale);
    }

    public IReadOnlyDictionary<string, string> GetDescriptionTranslations() => ReadDescriptionTranslations();

    private Dictionary<string, string> ReadDescriptionTranslations()
    {
        var translations = JsonSerializer.Deserialize<Dictionary<string, string>>(DescriptionTranslationsJson) ?? [];
        return new Dictionary<string, string>(translations, StringComparer.OrdinalIgnoreCase);
    }
}
