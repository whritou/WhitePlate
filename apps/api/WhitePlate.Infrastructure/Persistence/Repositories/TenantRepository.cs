using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.Json;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Catalog;
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
        var snapshot = new PublishedCatalogSnapshot(tenant.Id, tenant.Currency, tenant.DefaultMenuLocale,
            tenant.GetMenuLocales(), [], [], [], [], []);
        var snapshotJson = JsonSerializer.Serialize(snapshot, CatalogPublicationJson.Options);
        var now = DateTimeOffset.UtcNow;
        var publicationHead = CatalogPublicationHead.Create(tenant.Id, 1, snapshotJson, now);
        var baselineRevision = CatalogRevision.Create(tenant.Id, 1, snapshotJson, "[]", "baseline",
            null, "system", "tenant-created", now);
        database.CatalogPublicationHeads.Add(publicationHead);
        database.CatalogRevisions.Add(baselineRevision);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (exception.InnerException is PostgresException
            { SqlState: PostgresErrorCodes.UniqueViolation, ConstraintName: TenantConfiguration.SubdomainIndex })
        {
            database.Entry(publicationHead).State = EntityState.Detached;
            database.Entry(baselineRevision).State = EntityState.Detached;
            database.Entry(tenant).State = EntityState.Detached;
            return false;
        }
    }
}
