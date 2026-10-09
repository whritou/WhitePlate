using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public sealed class Product
{
    public const int MaxNameLength = 160;
    public const int MaxDescriptionLength = 1000;
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
}
