using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Tenants;

internal static class StorefrontAccess
{
    public static Task<bool> CanManageAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.StorefrontManage, cancellationToken);
}
