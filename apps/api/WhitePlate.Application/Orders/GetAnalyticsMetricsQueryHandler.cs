using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Orders;

public sealed class GetAnalyticsMetricsQueryHandler(IAnalyticsRepository analytics,
    IStaffMembershipRepository memberships, TimeProvider timeProvider)
{
    public async Task<Result<AnalyticsMetricsDto>> HandleAsync(AnalyticsMetricsQuery query,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        ArgumentNullException.ThrowIfNull(identity);
        if (query.TenantId == Guid.Empty || query.Days is not (7 or 30 or 90))
            return Result<AnalyticsMetricsDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed));

        var canView = await OrderStaffAccess.CanViewHistoryAsync(memberships, query.TenantId,
            identity, cancellationToken);
        if (!canView)
            return Result<AnalyticsMetricsDto>.Failure(new ApplicationError(ErrorCode.Forbidden));

        var result = await analytics.GetMetricsAsync(query.TenantId, query.Days,
            timeProvider.GetUtcNow(), cancellationToken);
        return result is null
            ? Result<AnalyticsMetricsDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<AnalyticsMetricsDto>.Success(result);
    }
}
