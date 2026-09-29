namespace WhitePlate.Infrastructure.Persistence;

public sealed class IdempotencyRecord
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string KeyHash { get; private set; } = null!;
    public string RequestHash { get; private set; } = null!;
    public string ResponseJson { get; private set; } = null!;
    public DateTimeOffset ExpiresAt { get; private set; }

    private IdempotencyRecord() { }

    public static IdempotencyRecord Create(Guid tenantId, string keyHash, string requestHash,
        string responseJson, DateTimeOffset now) => new()
    {
        Id = Guid.NewGuid(), TenantId = tenantId, KeyHash = keyHash, RequestHash = requestHash,
        ResponseJson = responseJson, ExpiresAt = now.AddHours(24)
    };

    public bool IsExpired(DateTimeOffset now) => ExpiresAt <= now;
}
