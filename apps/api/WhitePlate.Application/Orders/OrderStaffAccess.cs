using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Orders;

internal static class OrderStaffAccess
{
    public static async Task<bool> CanViewAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        await memberships.IsOrganizationOwnerOfTenantAsync(tenantId, identity, cancellationToken) ||
        await memberships.HasRestaurantRoleAsync(tenantId, identity, RestaurantRole.Manager, cancellationToken) ||
        await memberships.HasRestaurantRoleAsync(tenantId, identity, RestaurantRole.Kitchen, cancellationToken);

    public static async Task<bool> CanCancelAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        await memberships.IsOrganizationOwnerOfTenantAsync(tenantId, identity, cancellationToken) ||
        await memberships.HasRestaurantRoleAsync(tenantId, identity, RestaurantRole.Manager, cancellationToken);
}
