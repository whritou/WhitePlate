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

        order.TransitionTo(OrderStatus.Preparing);
        order.TransitionTo(OrderStatus.Preparing);

        Assert.Equal(OrderStatus.Preparing, order.Status);
        Assert.Equal(version + 1, order.Version);
        Assert.Throws<InvalidOrderTransitionException>(() => order.TransitionTo(OrderStatus.Pending));
    }

    [Fact]
    public void CompletedOrderCannotBeCancelled()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow);
        order.TransitionTo(OrderStatus.Preparing);
        order.TransitionTo(OrderStatus.Ready);
        order.TransitionTo(OrderStatus.Completed);

        Assert.Throws<InvalidOrderTransitionException>(order.Cancel);
    }
}
