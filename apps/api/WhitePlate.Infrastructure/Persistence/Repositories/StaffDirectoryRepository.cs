using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class StaffDirectoryRepository(WhitePlateDbContext database) : IStaffDirectoryRepository
{
    public async Task<CurrentUserDto> GetAsync(ExternalIdentity identity, CancellationToken cancellationToken)
    {
        var organizations = await database.OrganizationOwnerMemberships.AsNoTracking()
            .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
            .Join(database.Organizations.AsNoTracking(), membership => membership.OrganizationId,
                organization => organization.Id, (membership, organization) => organization)
            .Where(organization => organization.IsActive)
            .OrderBy(organization => organization.Name)
            .Select(organization => new OrganizationMembershipDto(organization.Id, organization.Name, "OrganizationOwner"))
            .ToListAsync(cancellationToken);
        var ownedIds = organizations.Select(organization => organization.Id).ToArray();
        var restaurants = await database.Tenants.AsNoTracking().Where(tenant =>
                ownedIds.Contains(tenant.OrganizationId) && tenant.IsActive)
            .Select(tenant => new RestaurantMembershipDto(tenant.Id, tenant.OrganizationId, tenant.Name,
                tenant.Subdomain.Value, tenant.Currency, "OrganizationOwner", RestaurantPermissionCatalog.Keys))
            .ToListAsync(cancellationToken);
        var directRoles = await database.RestaurantMemberships.AsNoTracking()
            .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
            .Select(membership => new { membership.TenantId, membership.Role })
            .ToListAsync(cancellationToken);
        var directTenantIds = directRoles.Select(membership => membership.TenantId).ToArray();
        var directTenants = await database.Tenants.AsNoTracking()
            .Where(tenant => directTenantIds.Contains(tenant.Id) && !ownedIds.Contains(tenant.OrganizationId) &&
                database.Organizations.Any(organization => organization.Id == tenant.OrganizationId && organization.IsActive))
            .Select(tenant => new { tenant.Id, tenant.OrganizationId, tenant.Name, tenant.Subdomain, tenant.Currency })
            .ToListAsync(cancellationToken);
        var organizationIds = directTenants.Select(tenant => tenant.OrganizationId).Distinct().ToArray();
        var grants = await database.OrganizationRoleGrants.AsNoTracking()
            .Where(grant => organizationIds.Contains(grant.OrganizationId))
            .Select(grant => new { grant.OrganizationId, grant.Role, grant.Permissions })
            .ToListAsync(cancellationToken);
        var permissionByRole = grants.ToDictionary(item => (item.OrganizationId, item.Role),
            item => RestaurantPermissionCatalog.ToKeys(item.Permissions));
        restaurants.AddRange(from tenant in directTenants
            join membership in directRoles on tenant.Id equals membership.TenantId
            select new RestaurantMembershipDto(tenant.Id, tenant.OrganizationId, tenant.Name,
                tenant.Subdomain.Value, tenant.Currency, membership.Role.ToString(),
                permissionByRole.GetValueOrDefault((tenant.OrganizationId, membership.Role), [])));
        return new CurrentUserDto(identity.Issuer, identity.Subject, organizations,
            restaurants.OrderBy(restaurant => restaurant.Name).ToArray());
    }
}
