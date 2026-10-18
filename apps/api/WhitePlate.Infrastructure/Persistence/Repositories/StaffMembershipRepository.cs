using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class StaffMembershipRepository(WhitePlateDbContext database) : IStaffMembershipRepository
{
    public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken) => database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(
        membership => membership.OrganizationId == organizationId && database.Organizations.Any(organization =>
                organization.Id == membership.OrganizationId && organization.IsActive) && membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject, cancellationToken);

    public async Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        var organizationId = await database.Tenants.AsNoTracking().Where(tenant => tenant.Id == tenantId)
            .Select(tenant => (Guid?)tenant.OrganizationId).SingleOrDefaultAsync(cancellationToken);
        return organizationId.HasValue && await IsOrganizationOwnerAsync(organizationId.Value, identity, cancellationToken);
    }

    public Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity identity, RestaurantRole role,
        CancellationToken cancellationToken) => database.RestaurantMemberships.AsNoTracking().AnyAsync(
        membership => membership.TenantId == tenantId && database.Tenants.Any(tenant => tenant.Id == membership.TenantId &&
                database.Organizations.Any(organization => organization.Id == tenant.OrganizationId && organization.IsActive)) &&
            membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject && membership.Role == role && membership.RoleId == role.ToString(), cancellationToken);

    public async Task<bool> HasPermissionAsync(Guid tenantId, ExternalIdentity identity,
        RestaurantPermission permission, CancellationToken cancellationToken)
    {
        if (permission is RestaurantPermission.None ||
            (permission & (permission - 1)) != 0 || (permission & RestaurantPermission.All) != permission)
            return false;
        if (await IsOrganizationOwnerOfTenantAsync(tenantId, identity, cancellationToken)) return true;

        var membership = await database.RestaurantMemberships.AsNoTracking()
            .Join(database.Tenants.AsNoTracking(), member => member.TenantId, tenant => tenant.Id,
                (member, tenant) => new { Member = member, tenant.OrganizationId })
            .Where(item => item.Member.TenantId == tenantId && item.Member.Issuer == identity.Issuer &&
                item.Member.Subject == identity.Subject && database.Organizations.Any(organization =>
                    organization.Id == item.OrganizationId && organization.IsActive))
            .Where(item => item.Member.OrganizationId == null || item.Member.OrganizationId == item.OrganizationId)
            .Select(item => new { item.OrganizationId, item.Member.RoleId })
            .SingleOrDefaultAsync(cancellationToken);
        if (membership is null) return false;

        var grants = await database.OrganizationRoleGrants.AsNoTracking().SingleOrDefaultAsync(item =>
            item.OrganizationId == membership.OrganizationId && item.RoleId == membership.RoleId && !item.IsArchived,
            cancellationToken);
        return grants is not null && grants.Has(permission);
    }

    public Task<bool> HasOrganizationPermissionAsync(Guid organizationId, ExternalIdentity identity,
        RestaurantPermission permission, CancellationToken cancellationToken)
    {
        if (permission is RestaurantPermission.None ||
            (permission & (permission - 1)) != 0 || (permission & RestaurantPermission.All) != permission)
            return Task.FromResult(false);

        return database.RestaurantMemberships.AsNoTracking()
            .Join(database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId && tenant.IsActive),
                member => member.TenantId, tenant => tenant.Id, (member, tenant) => new { Member = member, tenant.OrganizationId })
            .AnyAsync(item => item.Member.Issuer == identity.Issuer && item.Member.Subject == identity.Subject &&
                (item.Member.OrganizationId == null || item.Member.OrganizationId == organizationId) &&
                database.Organizations.Any(organization => organization.Id == organizationId && organization.IsActive) &&
                database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == organizationId &&
                    grant.RoleId == item.Member.RoleId && !grant.IsArchived &&
                    (grant.Permissions & permission) == permission), cancellationToken);
    }
}
