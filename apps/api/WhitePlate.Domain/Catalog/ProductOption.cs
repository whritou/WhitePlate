using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public sealed class ProductOption
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public Guid GroupId { get; private set; }
    public string Name { get; private set; } = null!;
    public decimal PriceAdjustment { get; private set; }
    public int SortOrder { get; private set; }
    public bool IsArchived { get; private set; }

    private ProductOption() { }

    public static ProductOption Create(Guid tenantId, Guid groupId, string? name, decimal priceAdjustment, int sortOrder)
    {
        var normalizedName = name?.Trim();
        if (tenantId == Guid.Empty || groupId == Guid.Empty)
            throw new DomainRuleException("invalid_option_group", "groupId", "An option group is required.");
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Option name must contain 1 to 120 characters.");
        if (priceAdjustment < 0 || decimal.Round(priceAdjustment, 2) != priceAdjustment)
            throw new DomainRuleException("invalid_price", "priceAdjustment", "Option price must be nonnegative with at most two decimal places.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        return new ProductOption { Id = Guid.NewGuid(), TenantId = tenantId, GroupId = groupId,
            Name = normalizedName, PriceAdjustment = priceAdjustment, SortOrder = sortOrder };
    }

    public void Update(string? name, decimal priceAdjustment, int sortOrder)
    {
        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Option name must contain 1 to 120 characters.");
        if (priceAdjustment < 0 || decimal.Round(priceAdjustment, 2) != priceAdjustment)
            throw new DomainRuleException("invalid_price", "priceAdjustment", "Option price must be nonnegative with at most two decimal places.");
        if (sortOrder < 0) throw new DomainRuleException("invalid_sort_order", "sortOrder", "Sort order cannot be negative.");
        Name = normalizedName;
        PriceAdjustment = priceAdjustment;
        SortOrder = sortOrder;
    }

    public void Archive() => IsArchived = true;
}
