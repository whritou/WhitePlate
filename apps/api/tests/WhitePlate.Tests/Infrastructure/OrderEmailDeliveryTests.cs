using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Infrastructure;

public sealed class OrderEmailDeliveryTests
{
    [Fact]
    public void AcceptedDeliveryClearsRecipientAndRenderedContent()
    {
        var now = new DateTimeOffset(2026, 10, 17, 12, 0, 0, TimeSpan.Zero);
        var delivery = OrderEmailDelivery.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "order.created", "guest@example.test", now);
        delivery.SavePayloadSnapshot("Subject", "<p>__WHITEPLATE_ORDER_EMAIL_TRACKING_TOKEN__</p>", "Message");
        delivery.Claim(now, TimeSpan.FromMinutes(2));

        delivery.MarkAccepted("resend-message-1", now.AddSeconds(3));

        Assert.Equal(OrderEmailDeliveryStatus.Accepted, delivery.Status);
        Assert.Equal(1, delivery.AttemptCount);
        Assert.Equal("resend-message-1", delivery.ProviderMessageId);
        Assert.Equal(now.AddSeconds(3), delivery.AcceptedAt);
        Assert.Null(delivery.RecipientEmail);
        Assert.Null(delivery.SubjectSnapshot);
        Assert.Null(delivery.HtmlSnapshot);
        Assert.Null(delivery.TextSnapshot);
    }

    [Fact]
    public void DeliveryStopsAfterTenAttemptsAndScrubsRecipientAndContent()
    {
        var now = new DateTimeOffset(2026, 10, 17, 12, 0, 0, TimeSpan.Zero);
        var delivery = OrderEmailDelivery.Create(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            "order.ready", "guest@example.test", now);
        delivery.SavePayloadSnapshot("Subject", "Email body", "Email body");

        for (var attempt = 1; attempt <= 10; attempt++)
        {
            var attemptAt = now.AddMinutes(attempt);
            delivery.Claim(attemptAt, TimeSpan.FromMinutes(2));
            delivery.ScheduleRetry(attemptAt.AddSeconds(1), "provider_unavailable");
        }

        Assert.Equal(OrderEmailDeliveryStatus.Failed, delivery.Status);
        Assert.Equal(10, delivery.AttemptCount);
        Assert.Equal("provider_unavailable", delivery.LastFailureCode);
        Assert.Null(delivery.RecipientEmail);
        Assert.Null(delivery.SubjectSnapshot);
        Assert.Null(delivery.HtmlSnapshot);
        Assert.Null(delivery.TextSnapshot);
    }
}
