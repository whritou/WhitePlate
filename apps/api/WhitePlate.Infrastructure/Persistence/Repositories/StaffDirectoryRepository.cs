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
                tenant.Subdomain.Value, tenant.Currency, "OrganizationOwner", RestaurantPermissionCatalog.Keys,
                "OrganizationOwner", "Owner"))
            .ToListAsync(cancellationToken);
        var directRoles = await database.RestaurantMemberships.AsNoTracking()
            .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
            .Select(membership => new { membership.TenantId, membership.RoleId })
            .ToListAsync(cancellationToken);
        var directTenantIds = directRoles.Select(membership => membership.TenantId).ToArray();
        var directTenants = await database.Tenants.AsNoTracking()
            .Where(tenant => directTenantIds.Contains(tenant.Id) && !ownedIds.Contains(tenant.OrganizationId) &&
                database.Organizations.Any(organization => organization.Id == tenant.OrganizationId && organization.IsActive))
            .Select(tenant => new { tenant.Id, tenant.OrganizationId, tenant.Name, tenant.Subdomain, tenant.Currency })
            .ToListAsync(cancellationToken);
        var organizationIds = directTenants.Select(tenant => tenant.OrganizationId).Distinct().ToArray();
        var roleIds = directRoles.Select(membership => membership.RoleId).Distinct().ToArray();
        var grants = await database.OrganizationRoleGrants.AsNoTracking()
            .Where(grant => organizationIds.Contains(grant.OrganizationId) && roleIds.Contains(grant.RoleId) &&
                !grant.IsArchived)
            .Select(grant => new { grant.OrganizationId, grant.RoleId, grant.Role, grant.Name, grant.Permissions })
            .ToListAsync(cancellationToken);
        var grantByRole = grants.ToDictionary(item => (item.OrganizationId, item.RoleId));
        restaurants.AddRange(from tenant in directTenants
            join membership in directRoles on tenant.Id equals membership.TenantId
            let grant = grantByRole.GetValueOrDefault((tenant.OrganizationId, membership.RoleId))
            select new RestaurantMembershipDto(tenant.Id, tenant.OrganizationId, tenant.Name,
                tenant.Subdomain.Value, tenant.Currency,
                grant is null ? membership.RoleId : membership.RoleId == grant.Role.ToString()
                    ? grant.Role.ToString()
                    : membership.RoleId,
                grant is null ? [] : RestaurantPermissionCatalog.ToKeys(grant.Permissions),
                membership.RoleId, grant?.Name));
        return new CurrentUserDto(identity.Issuer, identity.Subject, organizations,
            restaurants.OrderBy(restaurant => restaurant.Name).ToArray());
    }
}
