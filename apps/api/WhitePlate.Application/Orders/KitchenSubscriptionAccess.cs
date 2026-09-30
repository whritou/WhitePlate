using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Orders;

public sealed class KitchenSubscriptionAccess(IStaffMembershipRepository memberships)
{
    public Task<bool> CanJoinAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken) =>
        OrderStaffAccess.CanViewAsync(memberships, tenantId, identity, cancellationToken);
}
