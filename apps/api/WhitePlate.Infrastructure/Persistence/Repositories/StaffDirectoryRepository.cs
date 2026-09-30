using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class StaffDirectoryRepository(WhitePlateDbContext database) : IStaffDirectoryRepository
{
    public async Task<CurrentUserDto> GetAsync(ExternalIdentity identity, CancellationToken cancellationToken)
    {
        var organizations = await database.OrganizationOwnerMemberships.AsNoTracking()
            .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
            .Join(database.Organizations.AsNoTracking(), membership => membership.OrganizationId,
                organization => organization.Id, (membership, organization) => organization)
            .OrderBy(organization => organization.Name)
            .Select(organization => new OrganizationMembershipDto(organization.Id, organization.Name, "OrganizationOwner"))
            .ToListAsync(cancellationToken);
        var ownedIds = organizations.Select(organization => organization.Id).ToArray();
        var restaurants = await database.Tenants.AsNoTracking().Where(tenant => ownedIds.Contains(tenant.OrganizationId))
            .Select(tenant => new RestaurantMembershipDto(tenant.Id, tenant.OrganizationId, tenant.Name,
                tenant.Subdomain.Value, tenant.Currency, "OrganizationOwner")).ToListAsync(cancellationToken);
        var directRoles = await database.RestaurantMemberships.AsNoTracking()
            .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
            .Select(membership => new { membership.TenantId, membership.Role })
            .ToListAsync(cancellationToken);
        var directTenantIds = directRoles.Select(membership => membership.TenantId).ToArray();
        var directTenants = await database.Tenants.AsNoTracking()
            .Where(tenant => directTenantIds.Contains(tenant.Id) && !ownedIds.Contains(tenant.OrganizationId))
            .Select(tenant => new { tenant.Id, tenant.OrganizationId, tenant.Name, tenant.Subdomain, tenant.Currency })
            .ToListAsync(cancellationToken);
        restaurants.AddRange(from tenant in directTenants
            join membership in directRoles on tenant.Id equals membership.TenantId
            select new RestaurantMembershipDto(tenant.Id, tenant.OrganizationId, tenant.Name,
                tenant.Subdomain.Value, tenant.Currency, membership.Role.ToString()));
        return new CurrentUserDto(identity.Issuer, identity.Subject, organizations,
            restaurants.OrderBy(restaurant => restaurant.Name).ToArray());
    }
}
