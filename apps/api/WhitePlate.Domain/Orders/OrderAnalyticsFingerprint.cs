namespace WhitePlate.Domain.Orders;

public sealed class OrderAnalyticsFingerprint
{
    public Guid TenantId { get; private set; }
    public Guid OrderId { get; private set; }
    public string KeyVersion { get; private set; } = null!;
    public string FingerprintHash { get; private set; } = null!;
    public DateTimeOffset ExpiresAt { get; private set; }

    private OrderAnalyticsFingerprint() { }

    internal OrderAnalyticsFingerprint(Guid tenantId, string keyVersion, string fingerprintHash,
        DateTimeOffset expiresAt)
    {
        TenantId = tenantId;
        KeyVersion = keyVersion;
        FingerprintHash = fingerprintHash.ToLowerInvariant();
        ExpiresAt = expiresAt;
    }
}
