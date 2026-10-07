using Microsoft.EntityFrameworkCore;
using Npgsql;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence.Configurations;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class TenantRepository(WhitePlateDbContext database) : ITenantRepository
{
    public Task<Tenant?> FindActiveBySubdomainAsync(TenantSubdomain subdomain, CancellationToken cancellationToken) =>
        database.Tenants.AsNoTracking().SingleOrDefaultAsync(
            tenant => tenant.Subdomain == subdomain && tenant.IsActive && database.Organizations.Any(organization =>
                organization.Id == tenant.OrganizationId && organization.IsActive), cancellationToken);

    public async Task<bool> TryAddAsync(Tenant tenant, CancellationToken cancellationToken)
    {
        // Friendly early rejection; the unique index also protects concurrent creates.
        if (await database.Tenants.AnyAsync(existing => existing.Subdomain == tenant.Subdomain, cancellationToken))
        {
            return false;
        }

        database.Tenants.Add(tenant);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: TenantConfiguration.SubdomainIndex })
        {
            database.Entry(tenant).State = EntityState.Detached;
            return false;
        }
    }
}
