namespace WhitePlate.Domain.Payments;

public static class StripeReadinessClassifier
{
    public static StripeReadinessState Classify(StripeAccountReadinessInput account)
    {
        ArgumentNullException.ThrowIfNull(account);
        if (account.CurrentlyDueCount < 0 || account.PastDueCount < 0 || account.PendingVerificationCount < 0)
            return StripeReadinessState.Unknown;

        var capabilityStatus = account.CardPaymentsCapabilityStatus?.Trim().ToLowerInvariant();
        if (account.CurrentlyDueCount > 0 || account.PastDueCount > 0)
            return StripeReadinessState.ActionRequired;

        if (account.PendingVerificationCount > 0 || capabilityStatus == "pending")
            return StripeReadinessState.PendingVerification;

        if (!account.DetailsSubmitted)
            return StripeReadinessState.Onboarding;

        if (!account.ChargesEnabled || !account.PayoutsEnabled ||
            capabilityStatus is "disabled" or "inactive" or "unrequested" or "restricted")
            return StripeReadinessState.Restricted;

        return capabilityStatus == "active"
            ? StripeReadinessState.Verified
            : StripeReadinessState.Unknown;
    }
}
