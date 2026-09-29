using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class StaffMembershipRepository(WhitePlateDbContext database) : IStaffMembershipRepository
{
    public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken) => database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(
        membership => membership.OrganizationId == organizationId && membership.Issuer == identity.Issuer &&
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
        membership => membership.TenantId == tenantId && membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject && membership.Role == role, cancellationToken);
}
