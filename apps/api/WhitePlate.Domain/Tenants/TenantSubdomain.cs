using System.Text.RegularExpressions;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed partial record TenantSubdomain
{
    public string Value { get; }

    private TenantSubdomain(string value) => Value = value;

    public static bool TryCreate(string? value, out TenantSubdomain? subdomain)
    {
        var normalized = value?.Trim().ToLowerInvariant();
        if (normalized is null || normalized.Length is < 1 or > 63 || !LabelPattern().IsMatch(normalized))
        {
            subdomain = null;
            return false;
        }

        subdomain = new TenantSubdomain(normalized);
        return true;
    }

    public static TenantSubdomain Create(string? value) => TryCreate(value, out var subdomain)
        ? subdomain!
        : throw new DomainRuleException("invalid_subdomain", "subdomain",
            "Use 1 to 63 letters, digits or internal hyphens for the subdomain.");

    [GeneratedRegex("^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")]
    private static partial Regex LabelPattern();
}
