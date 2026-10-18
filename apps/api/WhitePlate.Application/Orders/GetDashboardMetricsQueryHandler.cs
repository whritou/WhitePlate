using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Orders;

public sealed class GetDashboardMetricsQueryHandler(IOrderRepository orders,
    IStaffMembershipRepository memberships, TimeProvider timeProvider)
{
    public async Task<Result<DashboardMetricsDto>> HandleAsync(DashboardMetricsQuery query,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();

        var canViewDashboard = await RestaurantPermissionAccess.HasAnyAsync(memberships, query.TenantId,
            identity, cancellationToken, RestaurantPermission.OrdersManage, RestaurantPermission.KitchenDisplay,
            RestaurantPermission.AnalyticsView);
        if (!canViewDashboard)
            return Result<DashboardMetricsDto>.Failure(new ApplicationError(ErrorCode.Forbidden));
        var includeOrderValue = await memberships.HasPermissionAsync(query.TenantId, identity,
            RestaurantPermission.AnalyticsView, cancellationToken);

        var metrics = await orders.GetDashboardMetricsAsync(query.TenantId, timeProvider.GetUtcNow(),
            includeOrderValue, cancellationToken);
        return metrics is null
            ? Result<DashboardMetricsDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<DashboardMetricsDto>.Success(metrics);
    }
}
