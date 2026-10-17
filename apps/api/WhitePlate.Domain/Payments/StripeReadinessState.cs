namespace WhitePlate.Domain.Payments;

public enum StripeReadinessState
{
    Unknown = 1,
    ActionRequired = 2,
    PendingVerification = 3,
    Onboarding = 4,
    Restricted = 5,
    Verified = 6
}
