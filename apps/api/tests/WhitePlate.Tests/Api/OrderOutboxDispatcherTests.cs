using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using WhitePlate.Api.Realtime;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Tests.Api;

public sealed class OrderOutboxDispatcherTests
{
    [Fact]
    public async Task PublishesClaimedEventAndMarksItDispatched()
    {
        var message = new KitchenOrderEvent(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "order.created",
            "Pending", 1, DateTimeOffset.UtcNow);
        var store = new RecordingOutboxStore(message);
        var publisher = new RecordingPublisher();
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddScoped<IOutboxStore>(_ => store);
        services.AddScoped<IOrderRepository>(_ => new NoOpOrderRepository());
        services.AddScoped<IOrderEventPublisher>(_ => publisher);
        await using var provider = services.BuildServiceProvider();
        var dispatcher = new OrderOutboxDispatcher(provider.GetRequiredService<IServiceScopeFactory>(),
            TimeProvider.System, provider.GetRequiredService<ILogger<OrderOutboxDispatcher>>());

        await dispatcher.StartAsync(CancellationToken.None);
        try
        {
            var delivered = await publisher.Delivered.Task.WaitAsync(TimeSpan.FromSeconds(5),
                TestContext.Current.CancellationToken);
            await store.Dispatched.Task.WaitAsync(TimeSpan.FromSeconds(5), TestContext.Current.CancellationToken);

            Assert.Equal(message, delivered);
            Assert.Equal(message.EventId, store.DispatchedId);
        }
        finally
        {
            await dispatcher.StopAsync(new CancellationTokenSource(TimeSpan.FromSeconds(5)).Token);
        }
    }

    private sealed class RecordingOutboxStore(KitchenOrderEvent message) : IOutboxStore
    {
        private int claimed;
        public TaskCompletionSource Dispatched { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public Guid? DispatchedId { get; private set; }

        public Task<IReadOnlyList<PendingKitchenEvent>> ClaimBatchAsync(DateTimeOffset now, DateTimeOffset leaseUntil,
            int batchSize, CancellationToken cancellationToken)
        {
            if (Interlocked.Exchange(ref claimed, 1) != 0)
                return Task.FromResult<IReadOnlyList<PendingKitchenEvent>>([]);
            var payload = JsonSerializer.Serialize(message, new JsonSerializerOptions(JsonSerializerDefaults.Web));
            return Task.FromResult<IReadOnlyList<PendingKitchenEvent>>(
                [new PendingKitchenEvent(message.EventId, payload, 1)]);
        }

        public Task MarkDispatchedAsync(Guid id, DateTimeOffset dispatchedAt, CancellationToken cancellationToken)
        {
            DispatchedId = id;
            Dispatched.TrySetResult();
            return Task.CompletedTask;
        }

        public Task ScheduleRetryAsync(Guid id, DateTimeOffset retryAt, CancellationToken cancellationToken) =>
            Task.CompletedTask;
    }

    private sealed class RecordingPublisher : IOrderEventPublisher
    {
        public TaskCompletionSource<KitchenOrderEvent> Delivered { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
        public Task PublishAsync(KitchenOrderEvent message, CancellationToken cancellationToken)
        {
            Delivered.TrySetResult(message);
            return Task.CompletedTask;
        }
    }

    private sealed class NoOpOrderRepository : IOrderRepository
    {
        public Task<int> DeleteExpiredIdempotencyRecordsAsync(DateTimeOffset now, CancellationToken cancellationToken) => Task.FromResult(0);
        public Task<IdempotencyResult> FindIdempotentOrderAsync(Guid tenantId, string keyHash, string requestHash, DateTimeOffset now, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<CheckoutLocaleDto?> ResolveCheckoutLocaleAsync(Guid tenantId, string? requestedLocale,
            CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<CheckoutCatalogDto> GetCheckoutCatalogAsync(Guid tenantId, string locale, string defaultLocale,
            IReadOnlyCollection<Guid> productIds, string? discountCode, CancellationToken cancellationToken) =>
            throw new NotSupportedException();
        public Task<IdempotencyResult> CreateOrderAsync(Order order, OrderReceiptDto receipt, string keyHash, string requestHash, DateTimeOffset now, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<OrderPageData> ListAsync(Guid tenantId, OrderStatus? status, OrderPageCursor? cursor, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<OrderHistoryPageData> GetHistoryAsync(Guid tenantId, OrderStatus? status, string? search,
            DateTimeOffset? createdAtFrom, DateTimeOffset? createdAtUntil, string sort, bool descending,
            int page, int pageSize, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<int> ArchiveClosedOrdersBeforeAsync(DateTimeOffset cutoff, CancellationToken cancellationToken) => throw new NotSupportedException();
        public Task<Result<OrderReceiptDto>> TransitionAsync(Guid tenantId, Guid orderId, int expectedVersion, OrderStatus status, DateTimeOffset now, CancellationToken cancellationToken) => throw new NotSupportedException();
    }
}
