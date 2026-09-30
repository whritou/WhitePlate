using Microsoft.Extensions.Options;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Api.Tenancy;

public sealed class TenantHostResolver(IOptions<TenantHostOptions> options)
{
    public string? Resolve(HostString host)
    {
        var hostname = host.Host.TrimEnd('.').ToLowerInvariant();
        var suffix = "." + options.Value.BaseDomain.TrimEnd('.').ToLowerInvariant();
        if (!hostname.EndsWith(suffix, StringComparison.Ordinal))
        {
            return null;
        }

        var label = hostname[..^suffix.Length];
        return TenantSubdomain.TryCreate(label, out var subdomain) ? subdomain!.Value : null;
    }
}
