using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

// Registry access only. This is not a repository for tenant-owned business records.
public interface ITenantRepository
{
    Task<Tenant?> FindActiveBySubdomainAsync(TenantSubdomain subdomain, CancellationToken cancellationToken);
    Task<bool> TryAddAsync(Tenant tenant, CancellationToken cancellationToken);
}
