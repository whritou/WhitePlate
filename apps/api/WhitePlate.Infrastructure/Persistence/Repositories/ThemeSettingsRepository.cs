using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class ThemeSettingsRepository(WhitePlateDbContext database) : IThemeSettingsRepository
{
    private IQueryable<Tenant> Active(Guid id) => database.Tenants.Where(row => row.Id == id && row.IsActive &&
        database.Organizations.Any(organization => organization.Id == row.OrganizationId && organization.IsActive));

    public Task<Tenant?> GetAsync(Guid tenantId, CancellationToken ct) =>
        Active(tenantId).AsNoTracking().SingleOrDefaultAsync(ct);

    public async Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, CancellationToken ct) =>
        await Active(tenant.Id).Where(row => row.ThemeDraftVersion == expectedVersion &&
            (database.OrganizationOwnerMemberships.Any(member => member.OrganizationId == row.OrganizationId &&
                member.Issuer == identity.Issuer && member.Subject == identity.Subject) ||
            database.RestaurantMemberships.Any(member => member.TenantId == row.Id &&
                member.Issuer == identity.Issuer && member.Subject == identity.Subject &&
                database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == row.OrganizationId &&
                    grant.Role == member.Role &&
                    (grant.Permissions & RestaurantPermission.StorefrontManage) == RestaurantPermission.StorefrontManage))))
            .ExecuteUpdateAsync(setters => setters.SetProperty(row => row.ThemeDraftJson, tenant.ThemeDraftJson)
                .SetProperty(row => row.ThemeDraftVersion, tenant.ThemeDraftVersion), ct) == 1;
}
