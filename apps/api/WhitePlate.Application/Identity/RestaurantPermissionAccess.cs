using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Identity;

public static class RestaurantPermissionAccess
{
    public static async Task<bool> HasAnyAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken, params RestaurantPermission[] permissions)
    {
        foreach (var permission in permissions)
            if (await memberships.HasPermissionAsync(tenantId, identity, permission, cancellationToken)) return true;
        return false;
    }
}
