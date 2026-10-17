using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;

namespace WhitePlate.Application.Orders;

public sealed class WithdrawAnalyticsConsentCommandHandler(IAnalyticsRepository analytics,
    IAnalyticsPrivacyService privacy)
{
    public async Task<Result<bool>> HandleAsync(Guid tenantId, string? email,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.ValidationFailed));

        var lookup = privacy.CreateLookup(tenantId, email);
        if (lookup.Status == AnalyticsFingerprintLookupStatus.InvalidEmail)
            return Result<bool>.Success(false);
        if (lookup.Status == AnalyticsFingerprintLookupStatus.Unavailable)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.Unavailable));

        await analytics.WithdrawAsync(tenantId, lookup.Hashes, cancellationToken);
        return Result<bool>.Success(true);
    }
}
