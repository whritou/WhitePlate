using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

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

        var includeOrderValue = await OrderStaffAccess.CanViewHistoryAsync(memberships,
            query.TenantId, identity, cancellationToken);
        if (!includeOrderValue && !await memberships.HasRestaurantRoleAsync(query.TenantId, identity,
                RestaurantRole.Kitchen, cancellationToken))
            return Result<DashboardMetricsDto>.Failure(new ApplicationError(ErrorCode.Forbidden));

        var metrics = await orders.GetDashboardMetricsAsync(query.TenantId, timeProvider.GetUtcNow(),
            includeOrderValue, cancellationToken);
        return metrics is null
            ? Result<DashboardMetricsDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<DashboardMetricsDto>.Success(metrics);
    }
}
