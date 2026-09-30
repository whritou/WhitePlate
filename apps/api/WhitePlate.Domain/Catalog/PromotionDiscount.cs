using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Catalog;

public enum DiscountKind
{
    FixedAmount = 1,
    Percentage = 2
}

public sealed class PromotionDiscount
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Code { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public DiscountKind Kind { get; private set; }
    public decimal Value { get; private set; }
    public bool IsActive { get; private set; }

    private PromotionDiscount() { }

    public static PromotionDiscount Create(Guid tenantId, string? code, string? name, DiscountKind kind, decimal value)
    {
        var normalizedCode = code?.Trim().ToUpperInvariant();
        var normalizedName = name?.Trim();
        if (tenantId == Guid.Empty) throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        if (string.IsNullOrWhiteSpace(normalizedCode) || normalizedCode.Length > 32 || normalizedCode.Any(character => !char.IsAsciiLetterOrDigit(character) && character != '-'))
            throw new DomainRuleException("invalid_discount_code", "code", "Discount code must use 1 to 32 letters, digits, or hyphens.");
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Discount name must contain 1 to 120 characters.");
        if (!Enum.IsDefined(kind) || value <= 0 || decimal.Round(value, 2) != value ||
            (kind == DiscountKind.Percentage && value > 100))
            throw new DomainRuleException("invalid_discount", "value", "Discount value is outside the supported range.");
        return new PromotionDiscount { Id = Guid.NewGuid(), TenantId = tenantId, Code = normalizedCode,
            Name = normalizedName, Kind = kind, Value = value, IsActive = true };
    }

    public void Update(string? name, DiscountKind kind, decimal value)
    {
        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Discount name must contain 1 to 120 characters.");
        if (!Enum.IsDefined(kind) || value <= 0 || decimal.Round(value, 2) != value ||
            (kind == DiscountKind.Percentage && value > 100))
            throw new DomainRuleException("invalid_discount", "value", "Discount value is outside the supported range.");
        Name = normalizedName;
        Kind = kind;
        Value = value;
    }

    public void Deactivate() => IsActive = false;
}
