using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrderingOperationsRepository(WhitePlateDbContext database) : IOrderingOperationsRepository
{
    private IQueryable<Tenant> Active(Guid id) => database.Tenants.Where(row => row.Id == id && row.IsActive &&
        database.Organizations.Any(organization => organization.Id == row.OrganizationId && organization.IsActive));

    public Task<Tenant?> GetAsync(Guid tenantId, CancellationToken cancellationToken) =>
        Active(tenantId).AsNoTracking().SingleOrDefaultAsync(cancellationToken);

    public async Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion,
        CancellationToken cancellationToken) =>
        await Active(tenant.Id).Where(row => (database.OrganizationOwnerMemberships.Any(membership =>
                membership.OrganizationId == row.OrganizationId && membership.Issuer == identity.Issuer &&
                membership.Subject == identity.Subject) ||
            database.RestaurantMemberships.Any(membership => membership.TenantId == row.Id &&
                membership.Issuer == identity.Issuer && membership.Subject == identity.Subject &&
                database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == row.OrganizationId &&
                    grant.RoleId == membership.RoleId && !grant.IsArchived &&
                    (grant.Permissions & RestaurantPermission.OrdersManage) == RestaurantPermission.OrdersManage))) &&
            row.OrderingOperationsVersion == expectedVersion)
            .ExecuteUpdateAsync(setters => setters.SetProperty(row => row.AcceptingOrders, tenant.AcceptingOrders)
                .SetProperty(row => row.RushHoldEnabled, tenant.RushHoldEnabled)
                .SetProperty(row => row.OrderingOperationsVersion, tenant.OrderingOperationsVersion),
                cancellationToken) == 1;
}
