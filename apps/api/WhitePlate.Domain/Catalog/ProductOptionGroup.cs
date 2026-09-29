using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public sealed class ProductOptionGroup
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid ProductId { get; private set; }
    public string Name { get; private set; } = null!;
    public int MinimumSelections { get; private set; }
    public int MaximumSelections { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsArchived { get; private set; }

    private ProductOptionGroup() { }

    public static ProductOptionGroup Create(Guid tenantId, Guid productId, string? name, int minimumSelections,
        int maximumSelections, int sortOrder)
    {
        var normalizedName = name?.Trim();
        if (tenantId == Guid.Empty || productId == Guid.Empty)
            throw new DomainRuleException("invalid_product", "productId", "A restaurant product is required.");
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Option group name must contain 1 to 120 characters.");
        if (minimumSelections < 0 || maximumSelections < 1 || maximumSelections > 20 || minimumSelections > maximumSelections)
            throw new DomainRuleException("invalid_selection_bounds", "maximumSelections", "Selection bounds must satisfy 0 ≤ minimum ≤ maximum ≤ 20.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        return new ProductOptionGroup { Id = Guid.NewGuid(), TenantId = tenantId, ProductId = productId,
            Name = normalizedName, MinimumSelections = minimumSelections, MaximumSelections = maximumSelections, SortOrder = sortOrder };
    }

    public void Update(string? name, int minimumSelections, int maximumSelections, int sortOrder)
    {
        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Option group name must contain 1 to 120 characters.");
        if (minimumSelections < 0 || maximumSelections < 1 || maximumSelections > 20 || minimumSelections > maximumSelections)
            throw new DomainRuleException("invalid_selection_bounds", "maximumSelections", "Selection bounds must satisfy 0 ≤ minimum ≤ maximum ≤ 20.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        Name = normalizedName;
        MinimumSelections = minimumSelections;
        MaximumSelections = maximumSelections;
        SortOrder = sortOrder;
    }

    public void Archive() => IsArchived = true;
}
