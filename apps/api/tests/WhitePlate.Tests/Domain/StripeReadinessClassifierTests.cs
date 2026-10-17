using System.Reflection;
using System.Text.Json;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Domain;

public sealed class StripeReadinessClassifierTests
{
    [Theory]
    [InlineData("action_required", "active", true, true, true, 1, 0, 0)]
    [InlineData("action_required", "pending", true, true, true, 0, 1, 0)]
    [InlineData("pending_verification", "active", true, true, true, 0, 0, 1)]
    [InlineData("pending_verification", "pending", true, true, true, 0, 0, 0)]
    [InlineData("onboarding", "inactive", false, false, false, 0, 0, 0)]
    [InlineData("restricted", "disabled", true, true, true, 0, 0, 0)]
    [InlineData("restricted", "restricted", true, true, true, 0, 0, 0)]
    [InlineData("restricted", "active", true, false, true, 0, 0, 0)]
    [InlineData("restricted", "active", true, true, false, 0, 0, 0)]
    [InlineData("verified", "active", true, true, true, 0, 0, 0)]
    [InlineData("unknown", "", true, true, true, 0, 0, 0)]
    public void ClassifiesStripeReadinessUsingTheApprovedPrecedence(string expected, string capabilityStatus,
        bool detailsSubmitted, bool chargesEnabled, bool payoutsEnabled, int currentlyDue, int pastDue,
        int pendingVerification)
    {
        var assembly = typeof(Tenant).Assembly;
        var snapshotType = assembly.GetType("WhitePlate.Domain.Payments.StripeAccountReadinessInput");
        var classifierType = assembly.GetType("WhitePlate.Domain.Payments.StripeReadinessClassifier");
        Assert.NotNull(snapshotType);
        Assert.NotNull(classifierType);

        var snapshot = JsonSerializer.Deserialize(
            JsonSerializer.Serialize(new
            {
                DetailsSubmitted = detailsSubmitted,
                ChargesEnabled = chargesEnabled,
                PayoutsEnabled = payoutsEnabled,
                CardPaymentsCapabilityStatus = capabilityStatus.Length == 0 ? null : capabilityStatus,
                CurrentlyDueCount = currentlyDue,
                PastDueCount = pastDue,
                PendingVerificationCount = pendingVerification
            }), snapshotType!, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        var classify = classifierType!.GetMethod("Classify", BindingFlags.Public | BindingFlags.Static);
        Assert.NotNull(classify);

        var result = classify!.Invoke(null, [snapshot]);

        var actual = result?.ToString();
        Assert.Equal(expected.Replace("_", string.Empty, StringComparison.Ordinal),
            actual is null ? null : new string(actual.Where(char.IsLetter).Select(char.ToLowerInvariant).ToArray()));
    }
}
