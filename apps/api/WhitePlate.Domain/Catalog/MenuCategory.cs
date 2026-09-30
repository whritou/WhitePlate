using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public sealed class MenuCategory
{
    public const int MaxNameLength = 120;
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Name { get; private set; } = null!;
    public string TranslationsJson { get; private set; } = "{}";
    public int SortOrder { get; private set; }
    public bool IsArchived { get; private set; }

    private MenuCategory() { }

    public static MenuCategory Create(Guid tenantId, string? name, int sortOrder)
    {
        if (tenantId == Guid.Empty) throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        return new MenuCategory { Id = Guid.NewGuid(), TenantId = tenantId, Name = NormalizeName(name), SortOrder = sortOrder };
    }

    public void Rename(string? name) => Name = NormalizeName(name);
    public void SetTranslation(string? locale, string? name, string? description = null) =>
        TranslationsJson = CatalogTranslations.Set(TranslationsJson, locale, name, description, MaxNameLength);
    public void Update(string? name, int sortOrder)
    {
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        Name = NormalizeName(name);
        SortOrder = sortOrder;
    }
    public void Archive() => IsArchived = true;

    private static string NormalizeName(string? name)
    {
        var value = name?.Trim();
        if (string.IsNullOrWhiteSpace(value) || value.Length > MaxNameLength)
            throw new DomainRuleException("invalid_name", "name", "Category name must contain 1 to 120 characters.");
        return value;
    }
}
