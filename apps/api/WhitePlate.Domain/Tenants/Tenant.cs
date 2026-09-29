using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed class Tenant
{
    public const int MaxNameLength = 200;
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
}
