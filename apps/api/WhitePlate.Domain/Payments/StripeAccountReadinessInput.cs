namespace WhitePlate.Domain.Payments;

public sealed record StripeAccountReadinessInput(
    bool DetailsSubmitted,
    bool ChargesEnabled,
    bool PayoutsEnabled,
    string? CardPaymentsCapabilityStatus,
    int CurrentlyDueCount,
    int PastDueCount,
    int PendingVerificationCount);
