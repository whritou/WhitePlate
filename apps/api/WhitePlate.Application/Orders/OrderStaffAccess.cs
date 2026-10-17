using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Orders;

internal static class OrderStaffAccess
{
    public static Task<bool> CanViewHistoryAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.OrdersManage, cancellationToken);

    public static Task<bool> CanViewAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        RestaurantPermissionAccess.HasAnyAsync(memberships, tenantId, identity, cancellationToken,
            RestaurantPermission.OrdersManage, RestaurantPermission.KitchenDisplay);

    public static Task<bool> CanCancelAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.OrdersManage, cancellationToken);
}
