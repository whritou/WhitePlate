using WhitePlate.Domain.Common;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Tests.Domain;

public sealed class OrderTests
{
    [Fact]
    public void CreateRejectsPickupModeWithoutResolvedPickupTime()
    {
        Assert.Throws<DomainRuleException>(() => Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow, pickupMode: PickupMode.Asap));
    }

    [Fact]
    public void CreateRejectsUndefinedPickupMode()
    {
        Assert.Throws<DomainRuleException>(() => Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow, pickupAt: DateTimeOffset.UtcNow, pickupMode: (PickupMode)99));
    }

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
    public void OrderLineRetainsProductDeclarationsAndPreparationGuidanceFromCheckout()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
            {
                ContainsAllergens = ["milk"],
                MayContainAllergens = ["sesame"],
                DietaryTags = ["vegetarian"],
                PreparationMinutes = 15,
                PreparationNotes = new Dictionary<string, string> { ["fr"] = "Préparé à la commande" }
            }
        ], null, 0m, DateTimeOffset.UtcNow);

        var line = Assert.Single(order.Lines);

        Assert.Equal(["milk"], line.ContainsAllergens);
        Assert.Equal(["sesame"], line.MayContainAllergens);
        Assert.Equal(["vegetarian"], line.DietaryTags);
        Assert.Equal(15, line.PreparationMinutes);
        Assert.Equal("Préparé à la commande", line.PreparationNotes["fr"]);
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

        Assert.Throws<InvalidOrderTransitionException>(() => order.Cancel(now, OrderCancellationReason.CustomerRequest));
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
    public void LifecycleRecordsWhenPreparationStartsAndTheOrderBecomesReady()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.Parse("2026-10-07T09:55:00Z"));
        var preparingAt = DateTimeOffset.Parse("2026-10-07T10:00:00Z");
        var readyAt = DateTimeOffset.Parse("2026-10-07T10:12:00Z");

        order.TransitionTo(OrderStatus.Preparing, preparingAt);
        order.TransitionTo(OrderStatus.Ready, readyAt);

        var preparingTimestamp = typeof(Order).GetProperty("PreparingAt");
        var readyTimestamp = typeof(Order).GetProperty("ReadyAt");
        Assert.NotNull(preparingTimestamp);
        Assert.NotNull(readyTimestamp);
        Assert.Equal(preparingAt, preparingTimestamp.GetValue(order));
        Assert.Equal(readyAt, readyTimestamp.GetValue(order));
    }

    [Fact]
    public void CancellingAnOrderRecordsWhenItWasClosed()
    {
        var cancelledAt = DateTimeOffset.Parse("2026-10-07T00:02:00Z");
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.Parse("2026-10-06T23:59:00Z"));

        order.Cancel(cancelledAt, OrderCancellationReason.ItemUnavailable);

        Assert.Equal(cancelledAt, order.ClosedAt);
        Assert.Equal(OrderCancellationReason.ItemUnavailable, order.CancellationReason);
        Assert.Null(order.ArchivedAt);
    }

    [Fact]
    public void CancellationRejectsUndefinedReasons()
    {
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow);

        var exception = Assert.Throws<DomainRuleException>(() =>
            order.Cancel(DateTimeOffset.UtcNow, (OrderCancellationReason)99));

        Assert.Equal("invalid_cancellation_reason", exception.Code);
        Assert.Null(order.CancellationReason);
        Assert.Equal(OrderStatus.Pending, order.Status);
    }

    [Fact]
    public void OrderEmailRequiresExplicitConsentAndIsClearedWhenTheOrderCloses()
    {
        var createdAt = DateTimeOffset.Parse("2026-10-17T10:00:00Z");
        var order = Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, createdAt, customerEmail: " Ada@example.com ", emailUpdatesConsentedAt: createdAt,
            emailTrackingTokenHash: new string('a', 64), trackingTokenExpiresAt: createdAt.AddDays(30));

        Assert.Equal("ada@example.com", order.CustomerEmail);
        Assert.Equal(createdAt, order.EmailUpdatesConsentedAt);
        Assert.Equal(new string('a', 64), order.EmailTrackingTokenHash);

        order.TransitionTo(OrderStatus.Preparing, createdAt.AddMinutes(1));
        order.TransitionTo(OrderStatus.Ready, createdAt.AddMinutes(2));
        order.TransitionTo(OrderStatus.Completed, createdAt.AddMinutes(3));

        Assert.Null(order.CustomerEmail);
        Assert.Null(order.EmailUpdatesConsentedAt);
        Assert.Equal(new string('a', 64), order.EmailTrackingTokenHash);

        order.ClearExpiredEmailData(createdAt.AddDays(30));
        Assert.Null(order.EmailTrackingTokenHash);
    }

    [Fact]
    public void OrderEmailCannotBeStoredWithoutConsent()
    {
        var exception = Assert.Throws<DomainRuleException>(() => Order.Create(Guid.NewGuid(), "EUR", "Ada", [
            new OrderLineSnapshot(Guid.NewGuid(), "Soup", 10m, 0m, 1, [])
        ], null, 0m, DateTimeOffset.UtcNow, customerEmail: "ada@example.com"));

        Assert.Equal("emailUpdatesConsent", exception.Field);
    }
}
