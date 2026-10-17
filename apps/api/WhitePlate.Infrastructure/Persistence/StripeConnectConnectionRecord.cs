using WhitePlate.Domain.Payments;

namespace WhitePlate.Infrastructure.Persistence;

public sealed class StripeConnectConnectionRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TenantId { get; set; }
    public StripeConnectMode Mode { get; set; }
    public string StripeAccountId { get; set; } = null!;
    public StripeConnectionState ConnectionState { get; set; }
    public StripeReadinessState ReadinessState { get; set; }
    public bool DetailsSubmitted { get; set; }
    public bool ChargesEnabled { get; set; }
    public bool PayoutsEnabled { get; set; }
    public string? CardPaymentsCapabilityStatus { get; set; }
    public int CurrentlyDueCount { get; set; }
    public int PastDueCount { get; set; }
    public int PendingVerificationCount { get; set; }
    public DateTimeOffset ConnectedAt { get; set; }
    public DateTimeOffset? LastVerifiedAt { get; set; }
    public DateTimeOffset? LastAppliedEventAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
