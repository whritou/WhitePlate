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
    public decimal MinimumOrderAmount { get; private set; }
    public DateOnly? ExpiresOn { get; private set; }
    public bool IsActive { get; private set; }

    private PromotionDiscount() { }

    public static PromotionDiscount Create(Guid tenantId, string? code, string? name, DiscountKind kind,
        decimal value, decimal minimumOrderAmount = 0m, DateOnly? expiresOn = null)
    {
        var normalizedCode = code?.Trim().ToUpperInvariant();
        var normalizedName = name?.Trim();
        if (tenantId == Guid.Empty) throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        if (string.IsNullOrWhiteSpace(normalizedCode) || normalizedCode.Length > 32 || normalizedCode.Any(character => !char.IsAsciiLetterOrDigit(character) && character != '-'))
            throw new DomainRuleException("invalid_discount_code", "code", "Discount code must use 1 to 32 letters, digits, or hyphens.");
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Discount name must contain 1 to 120 characters.");
        if (!Enum.IsDefined(kind) || value <= 0 || value > 9999999999.99m || decimal.Round(value, 2) != value ||
            (kind == DiscountKind.Percentage && value > 100))
            throw new DomainRuleException("invalid_discount", "value", "Discount value is outside the supported range.");
        ValidateMinimum(minimumOrderAmount);
        return new PromotionDiscount { Id = Guid.NewGuid(), TenantId = tenantId, Code = normalizedCode,
            Name = normalizedName, Kind = kind, Value = value, MinimumOrderAmount = minimumOrderAmount,
            ExpiresOn = expiresOn, IsActive = true };
    }

    public void Update(string? name, DiscountKind kind, decimal value,
        decimal minimumOrderAmount = 0m, DateOnly? expiresOn = null)
    {
        var normalizedName = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalizedName) || normalizedName.Length > 120)
            throw new DomainRuleException("invalid_name", "name", "Discount name must contain 1 to 120 characters.");
        if (!Enum.IsDefined(kind) || value <= 0 || value > 9999999999.99m || decimal.Round(value, 2) != value ||
            (kind == DiscountKind.Percentage && value > 100))
            throw new DomainRuleException("invalid_discount", "value", "Discount value is outside the supported range.");
        ValidateMinimum(minimumOrderAmount);
        Name = normalizedName;
        Kind = kind;
        Value = value;
        MinimumOrderAmount = minimumOrderAmount;
        ExpiresOn = expiresOn;
    }

    public void Deactivate() => IsActive = false;
    public void Activate() => IsActive = true;

    private static void ValidateMinimum(decimal value)
    {
        if (value < 0 || value > 9999999999.99m || decimal.Round(value, 2) != value)
            throw new DomainRuleException("invalid_minimum_order", "minimumOrderAmount",
                "Minimum order amount must be a non-negative amount with at most two decimal places.");
    }
}
