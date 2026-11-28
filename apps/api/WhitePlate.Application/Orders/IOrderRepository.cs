using WhitePlate.Domain.Orders;
using WhitePlate.Application.Common.Results;

namespace WhitePlate.Application.Orders;

public interface IOrderRepository
{
    Task<IdempotencyResult> FindIdempotentOrderAsync(Guid tenantId, string keyHash, string requestHash,
        DateTimeOffset now, CancellationToken cancellationToken);

    Task<CheckoutLocaleDto?> ResolveCheckoutLocaleAsync(Guid tenantId, string? requestedLocale,
        CancellationToken cancellationToken);

    Task<PickupAvailabilityDto> GetPickupSlotsAsync(Guid tenantId,
        DateTimeOffset now, CancellationToken cancellationToken);

    Task<CheckoutCatalogDto> GetCheckoutCatalogAsync(Guid tenantId, string locale, string defaultLocale,
        IReadOnlyCollection<Guid> productIds, string? discountCode, CancellationToken cancellationToken);

    Task<IdempotencyResult> CreateOrderAsync(Order order, OrderReceiptDto receipt, string keyHash,
        string requestHash, DateTimeOffset now, CancellationToken cancellationToken);

    Task<OrderPageData> ListAsync(Guid tenantId, OrderStatus? status, OrderPageCursor? cursor, int pageSize,
        CancellationToken cancellationToken);

    /// <summary>Lists order history; <paramref name="createdOnFrom"/> and <paramref name="createdOnThrough"/>
    /// are inclusive restaurant-local calendar days in the tenant's saved time zone.</summary>
    Task<OrderHistoryPageData> GetHistoryAsync(Guid tenantId, OrderStatus? status, string? search,
        DateOnly? createdOnFrom, DateOnly? createdOnThrough, string sort, bool descending,
        int page, int pageSize, CancellationToken cancellationToken);

    Task<DashboardMetricsDto?> GetDashboardMetricsAsync(Guid tenantId, DateTimeOffset now,
        bool includeOrderValue, CancellationToken cancellationToken);

    Task<PublicOrderTrackingDto?> GetPublicTrackingAsync(Guid tenantId, Guid orderId, string tokenHash,
        DateTimeOffset now, CancellationToken cancellationToken);

    /// <summary>Archives each tenant's terminal orders closed before the start of that tenant's current
    /// local day (in its saved time zone) at <paramref name="now"/>.</summary>
    Task<int> ArchiveClosedOrdersBeforeLocalDayStartAsync(DateTimeOffset now, CancellationToken cancellationToken);

    Task<Result<OrderReceiptDto>> TransitionAsync(Guid tenantId, Guid orderId, int expectedVersion,
        OrderStatus status, OrderCancellationReason? cancellationReason, DateTimeOffset now,
        CancellationToken cancellationToken);

    Task<int> DeleteExpiredIdempotencyRecordsAsync(DateTimeOffset now, CancellationToken cancellationToken);

    Task<int> CleanExpiredOrderEmailDataAsync(DateTimeOffset now, CancellationToken cancellationToken);
}
