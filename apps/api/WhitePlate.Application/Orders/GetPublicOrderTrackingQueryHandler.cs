using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;

namespace WhitePlate.Application.Orders;

public sealed class GetPublicOrderTrackingQueryHandler(IOrderRepository orders, TimeProvider timeProvider)
{
    public async Task<Result<PublicOrderTrackingDto>> HandleAsync(Guid tenantId, Guid orderId, string? token,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty || orderId == Guid.Empty || !OrderTrackingToken.TryHash(token, out var hash))
            return Result<PublicOrderTrackingDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var result = await orders.GetPublicTrackingAsync(tenantId, orderId, hash, timeProvider.GetUtcNow(),
            cancellationToken);
        return result is null
            ? Result<PublicOrderTrackingDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<PublicOrderTrackingDto>.Success(result);
    }
}
