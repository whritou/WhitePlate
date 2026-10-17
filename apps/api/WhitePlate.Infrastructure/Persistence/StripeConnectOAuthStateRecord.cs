using WhitePlate.Domain.Payments;

namespace WhitePlate.Infrastructure.Persistence;

public sealed class StripeConnectOAuthStateRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string StateHash { get; set; } = null!;
    public Guid TenantId { get; set; }
    public string OwnerIssuer { get; set; } = null!;
    public string OwnerSubject { get; set; } = null!;
    public StripeConnectMode Mode { get; set; }
    public string Locale { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
}
