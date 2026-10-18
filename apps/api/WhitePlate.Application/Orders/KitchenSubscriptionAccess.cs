using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Orders;

public sealed class KitchenSubscriptionAccess(IStaffMembershipRepository memberships)
{
    public Task<bool> CanJoinAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.KitchenDisplay, cancellationToken);
}
