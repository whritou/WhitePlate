using WhitePlate.Domain.Orders;
using WhitePlate.Application.Common.Results;

namespace WhitePlate.Application.Orders;

public interface IOrderRepository
{
    Task<IdempotencyResult> FindIdempotentOrderAsync(Guid tenantId, string keyHash, string requestHash,
        DateTimeOffset now, CancellationToken cancellationToken);

    Task<CheckoutLocaleDto?> ResolveCheckoutLocaleAsync(Guid tenantId, string? requestedLocale,
        CancellationToken cancellationToken);

    Task<CheckoutCatalogDto> GetCheckoutCatalogAsync(Guid tenantId, string locale, string defaultLocale,
        IReadOnlyCollection<Guid> productIds, string? discountCode, CancellationToken cancellationToken);

    Task<IdempotencyResult> CreateOrderAsync(Order order, OrderReceiptDto receipt, string keyHash,
        string requestHash, DateTimeOffset now, CancellationToken cancellationToken);

    Task<OrderPageData> ListAsync(Guid tenantId, OrderStatus? status, OrderPageCursor? cursor, int pageSize,
        CancellationToken cancellationToken);

    Task<OrderHistoryPageData> GetHistoryAsync(Guid tenantId, OrderStatus? status, string? search,
        DateTimeOffset? createdAtFrom, DateTimeOffset? createdAtUntil, string sort, bool descending,
        int page, int pageSize, CancellationToken cancellationToken);

    Task<int> ArchiveClosedOrdersBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken);

    Task<Result<OrderReceiptDto>> TransitionAsync(Guid tenantId, Guid orderId, int expectedVersion,
        OrderStatus status, DateTimeOffset now, CancellationToken cancellationToken);

    Task<int> DeleteExpiredIdempotencyRecordsAsync(DateTimeOffset now, CancellationToken cancellationToken);
}
