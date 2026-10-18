using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Identity;

public interface IStaffMembershipRepository
{
    Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken);
    Task<bool> IsOrganizationOwnerOfTenantAsync(Guid tenantId, ExternalIdentity identity, CancellationToken cancellationToken);
    Task<bool> HasRestaurantRoleAsync(Guid tenantId, ExternalIdentity identity, RestaurantRole role, CancellationToken cancellationToken);
    Task<bool> HasPermissionAsync(Guid tenantId, ExternalIdentity identity, RestaurantPermission permission, CancellationToken cancellationToken);
    Task<bool> HasOrganizationPermissionAsync(Guid organizationId, ExternalIdentity identity,
        RestaurantPermission permission, CancellationToken cancellationToken) => Task.FromResult(false);
}

public interface ICurrentIdentity
{
    ExternalIdentity? Identity { get; }
}
