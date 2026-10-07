using WhitePlate.Domain.Orders;

namespace WhitePlate.Tests.Domain;

public sealed class OrderTests
{
    [Fact]
    public void CreateSnapshotsLinePricingAndRoundsTaxToTwoDecimals()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 10m, 2,
                [new OrderOptionSnapshot(Guid.NewGuid(), "Large", 1.25m)])
        ], "LUNCH", 2m, DateTimeOffset.UtcNow);

        Assert.Equal(22.50m, order.Subtotal);
        Assert.Equal(2m, order.DiscountAmount);
        Assert.Equal(2.05m, order.TaxAmount);
        Assert.Equal(22.55m, order.Total);
        Assert.Equal("Soup", Assert.Single(order.Lines).ProductName);
    }

    [Fact]
    public void LifecycleOnlyMovesForwardAndRepeatingCurrentStatusIsNoOp()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow);
        var version = order.Version;

        var now = DateTimeOffset.UtcNow;
        order.TransitionTo(OrderStatus.Preparing, now);
        order.TransitionTo(OrderStatus.Preparing, now);

        Assert.Equal(OrderStatus.Preparing, order.Status);
        Assert.Equal(version + 1, order.Version);
        Assert.Throws<InvalidOrderTransitionException>(() => order.TransitionTo(OrderStatus.Pending, now));
    }

    [Fact]
    public void CompletedOrderCannotBeCancelled()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow);
        var now = DateTimeOffset.UtcNow;
        order.TransitionTo(OrderStatus.Preparing, now);
        order.TransitionTo(OrderStatus.Ready, now);
        order.TransitionTo(OrderStatus.Completed, now);

        Assert.Throws<InvalidOrderTransitionException>(() => order.Cancel(now));
    }

    [Fact]
    public void TerminalStatusRecordsWhenTheOrderWasClosed()
    {
        var createdAt = DateTimeOffset.Parse("2026-10-06T23:59:00Z");
        var completedAt = DateTimeOffset.Parse("2026-10-07T00:02:00Z");
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, createdAt);
        order.TransitionTo(OrderStatus.Preparing, completedAt);
        order.TransitionTo(OrderStatus.Ready, completedAt);

        order.TransitionTo(OrderStatus.Completed, completedAt);

        Assert.Equal(completedAt, order.ClosedAt);
        Assert.Null(order.ArchivedAt);
    }

    [Fact]
    public void CancellingAnOrderRecordsWhenItWasClosed()
    {
        var cancelledAt = DateTimeOffset.Parse("2026-10-07T00:02:00Z");
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.Parse("2026-10-06T23:59:00Z"));

        order.Cancel(cancelledAt);

        Assert.Equal(cancelledAt, order.ClosedAt);
        Assert.Null(order.ArchivedAt);
    }
}
