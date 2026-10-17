using WhitePlate.Domain.Payments;

namespace WhitePlate.Infrastructure.Persistence;

public sealed class StripeConnectWebhookEventRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public StripeConnectMode Mode { get; set; }
    public string EventId { get; set; } = null!;
    public string EventType { get; set; } = null!;
    public string? StripeAccountId { get; set; }
    public DateTimeOffset EventCreatedAt { get; set; }
    public DateTimeOffset ReceivedAt { get; set; }
}
