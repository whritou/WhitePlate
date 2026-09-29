using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Identity;

public interface IStaffMembershipRepository
{
    Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken);
    Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity identity, CancellationToken cancellationToken);
    Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity identity, RestaurantRole role, CancellationToken cancellationToken);
}

public interface ICurrentIdentity
{
    ExternalIdentity? Identity { get; }
}
