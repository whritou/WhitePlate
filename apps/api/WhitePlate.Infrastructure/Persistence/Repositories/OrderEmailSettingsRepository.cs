using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrderEmailSettingsRepository(WhitePlateDbContext database) : IOrderEmailSettingsRepository
{
    private IQueryable<Tenant> Active(Guid tenantId) => database.Tenants.Where(row => row.Id == tenantId && row.IsActive &&
        database.Organizations.Any(organization => organization.Id == row.OrganizationId && organization.IsActive));

    public Task<Tenant?> GetAsync(Guid tenantId, CancellationToken ct) =>
        Active(tenantId).AsNoTracking().SingleOrDefaultAsync(ct);

    public async Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, CancellationToken ct) =>
        await Active(tenant.Id).Where(row => row.OrderEmailTemplatesVersion == expectedVersion &&
            (database.OrganizationOwnerMemberships.Any(member => member.OrganizationId == row.OrganizationId &&
                member.Issuer == identity.Issuer && member.Subject == identity.Subject) ||
             database.RestaurantMemberships.Any(member => member.TenantId == row.Id &&
                member.Issuer == identity.Issuer && member.Subject == identity.Subject &&
                database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == row.OrganizationId &&
                    grant.Role == member.Role &&
                    (grant.Permissions & RestaurantPermission.OrdersManage) == RestaurantPermission.OrdersManage))))
            .ExecuteUpdateAsync(setters => setters.SetProperty(row => row.OrderEmailTemplatesJson, tenant.OrderEmailTemplatesJson)
                .SetProperty(row => row.OrderEmailTemplatesVersion, tenant.OrderEmailTemplatesVersion), ct) == 1;
}
