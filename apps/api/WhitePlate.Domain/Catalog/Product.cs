using WhitePlate.Domain.Common;
using System.Text.Json;

namespace WhitePlate.Domain.Catalog;

public sealed class Product
{
    public const int MaxNameLength = 160;
    public const int MaxDescriptionLength = 1000;
    public const int MaxSkuLength = 64;
    private static readonly HashSet<string> AllergenCodes = ["celery", "cerealsWithGluten", "crustaceans", "eggs",
        "fish", "lupin", "milk", "molluscs", "mustard", "nuts", "peanuts", "sesame", "soybeans", "sulphites"];
    private static readonly HashSet<string> DietaryCodes = ["dairyFree", "glutenFree", "pescatarian", "vegan", "vegetarian"];
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid CategoryId { get; private set; }
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public string TranslationsJson { get; private set; } = "{}";
    public decimal BasePrice { get; private set; }
    public decimal TaxRatePercent { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsAvailable { get; private set; }
    public bool IsArchived { get; private set; }
    public string? Sku { get; private set; }
    public string ContainsAllergensJson { get; private set; } = "[]";
    public string MayContainAllergensJson { get; private set; } = "[]";
    public string DietaryTagsJson { get; private set; } = "[]";
    public int? PreparationMinutes { get; private set; }
    public string PreparationNotesJson { get; private set; } = "{}";
    public IReadOnlyList<string> ContainsAllergens => JsonSerializer.Deserialize<string[]>(ContainsAllergensJson) ?? [];
    public IReadOnlyList<string> MayContainAllergens => JsonSerializer.Deserialize<string[]>(MayContainAllergensJson) ?? [];
    public IReadOnlyList<string> DietaryTags => JsonSerializer.Deserialize<string[]>(DietaryTagsJson) ?? [];
    public IReadOnlyDictionary<string, string> PreparationNotes =>
        JsonSerializer.Deserialize<Dictionary<string, string>>(PreparationNotesJson) ?? new();

    private Product() { }

    public static Product Create(Guid tenantId, Guid categoryId, string? name, string? description,
        decimal basePrice, decimal taxRatePercent, int sortOrder)
    {
        if (tenantId == Guid.Empty) throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        if (categoryId == Guid.Empty) throw new DomainRuleException("invalid_category", "categoryId", "A category is required.");
        if (basePrice < 0 || decimal.Round(basePrice, 2) != basePrice)
            throw new DomainRuleException("invalid_price", "basePrice", "Price must be nonnegative with at most two decimal places.");
        if (taxRatePercent < 0 || taxRatePercent > 100 || decimal.Round(taxRatePercent, 2) != taxRatePercent)
            throw new DomainRuleException("invalid_tax_rate", "taxRatePercent", "Tax rate must be from 0 to 100 with at most two decimal places.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");

        return new Product
        {
            Id = Guid.NewGuid(), TenantId = tenantId, CategoryId = categoryId,
            Name = NormalizeName(name), Description = NormalizeDescription(description), BasePrice = basePrice,
            TaxRatePercent = taxRatePercent, SortOrder = sortOrder, IsAvailable = true
        };
    }

    public void SetAvailability(bool available) => IsAvailable = available;
    public void ChangeCategory(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
            throw new DomainRuleException("invalid_category", "categoryId", "A category is required.");
        CategoryId = categoryId;
    }
    public void SetTranslation(string? locale, string? name, string? description) =>
        TranslationsJson = CatalogTranslations.Set(TranslationsJson, locale, name, description,
            MaxNameLength, MaxDescriptionLength);

    public void SetMetadata(string? sku, IReadOnlyCollection<string>? containsAllergens,
        IReadOnlyCollection<string>? mayContainAllergens, IReadOnlyCollection<string>? dietaryTags,
        int? preparationMinutes, IReadOnlyDictionary<string, string>? preparationNotes)
    {
        var normalizedSku = sku?.Trim().ToUpperInvariant();
        if (normalizedSku?.Length > MaxSkuLength || normalizedSku?.Any(character =>
                !char.IsAsciiLetterOrDigit(character) && character is not '-' and not '_' and not '.') == true)
            throw new DomainRuleException("invalid_sku", "sku", "SKU must use up to 64 letters, numbers, dots, dashes or underscores.");

        var contains = NormalizeCodes(containsAllergens, AllergenCodes, "containsAllergens");
        var mayContain = NormalizeCodes(mayContainAllergens, AllergenCodes, "mayContainAllergens");
        if (contains.Intersect(mayContain).Any())
            throw new DomainRuleException("overlapping_allergens", "mayContainAllergens", "An allergen cannot be declared both as present and possibly present.");

        var diets = NormalizeCodes(dietaryTags, DietaryCodes, "dietaryTags");
        if (preparationMinutes is < 1 or > 1440)
            throw new DomainRuleException("invalid_preparation_minutes", "preparationMinutes", "Preparation guidance must be from 1 to 1440 minutes.");

        var notes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var (locale, note) in preparationNotes ?? new Dictionary<string, string>())
        {
            if (locale is null || note is null)
                throw new DomainRuleException("invalid_preparation_notes", "preparationNotes", "Preparation notes require text values.");
            var key = locale.Trim().ToLowerInvariant();
            var value = note.Trim();
            if (key.Length is < 2 or > 16 || key.Any(character => !char.IsAsciiLetterOrDigit(character) && character != '-') || value.Length > 250)
                throw new DomainRuleException("invalid_preparation_notes", "preparationNotes", "Preparation notes require a valid locale and at most 250 characters.");
            if (value.Length > 0) notes[key] = value;
        }

        Sku = string.IsNullOrEmpty(normalizedSku) ? null : normalizedSku;
        ContainsAllergensJson = JsonSerializer.Serialize(contains);
        MayContainAllergensJson = JsonSerializer.Serialize(mayContain);
        DietaryTagsJson = JsonSerializer.Serialize(diets);
        PreparationMinutes = preparationMinutes;
        PreparationNotesJson = JsonSerializer.Serialize(notes);
    }
    public void Update(string? name, string? description, decimal basePrice, decimal taxRatePercent,
        int sortOrder, bool isAvailable)
    {
        if (basePrice < 0 || decimal.Round(basePrice, 2) != basePrice)
            throw new DomainRuleException("invalid_price", "basePrice", "Price must be nonnegative with at most two decimal places.");
        if (taxRatePercent < 0 || taxRatePercent > 100 || decimal.Round(taxRatePercent, 2) != taxRatePercent)
            throw new DomainRuleException("invalid_tax_rate", "taxRatePercent", "Tax rate must be from 0 to 100 with at most two decimal places.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        Name = NormalizeName(name);
        Description = NormalizeDescription(description);
        BasePrice = basePrice;
        TaxRatePercent = taxRatePercent;
        SortOrder = sortOrder;
        IsAvailable = isAvailable;
    }
    public void Archive() { IsArchived = true; IsAvailable = false; }

    public void Restore() => IsArchived = false;

    private static string NormalizeName(string? name)
    {
        var value = name?.Trim();
        if (string.IsNullOrWhiteSpace(value) || value.Length > MaxNameLength)
            throw new DomainRuleException("invalid_name", "name", "Product name must contain 1 to 160 characters.");
        return value;
    }

    private static string? NormalizeDescription(string? description)
    {
        var value = description?.Trim();
        if (value?.Length > MaxDescriptionLength)
            throw new DomainRuleException("invalid_description", "description", "Description cannot exceed 1000 characters.");
        return string.IsNullOrEmpty(value) ? null : value;
    }

    private static string[] NormalizeCodes(IReadOnlyCollection<string>? values, HashSet<string> supported, string field)
    {
        if (values?.Any(value => value is null) == true)
            throw new DomainRuleException("invalid_metadata_code", field, "One or more declarations are not supported.");
        var codes = (values ?? []).Select(value => value.Trim()).Distinct(StringComparer.Ordinal).Order().ToArray();
        if (codes.Length > supported.Count || codes.Any(code => !supported.Contains(code)))
            throw new DomainRuleException("invalid_metadata_code", field, "One or more declarations are not supported.");
        return codes;
    }
}
