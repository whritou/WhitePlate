using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Realtime;

[Authorize]
public sealed class KitchenHub(ICurrentIdentity currentIdentity, KitchenSubscriptionAccess access) : Hub
{
    public async Task JoinRestaurant(Guid tenantId)
    {
        var identity = currentIdentity.Identity;
        if (identity is null || tenantId == Guid.Empty)
            throw new HubException("Restaurant access is required.");

        var authorized = await access.CanJoinAsync(tenantId, identity, Context.ConnectionAborted);
        if (!authorized)
            throw new HubException("Restaurant access is required.");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(tenantId), Context.ConnectionAborted);
    }

    public Task LeaveRestaurant(Guid tenantId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(tenantId), Context.ConnectionAborted);

    public static string GroupName(Guid tenantId) => $"restaurant:{tenantId:N}";
}
