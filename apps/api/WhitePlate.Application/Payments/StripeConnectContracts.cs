using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Payments;

namespace WhitePlate.Application.Payments;

public enum StripeConnectOperation
{
    StatusRead,
    OAuth,
    Webhook
}

public sealed class StripeConnectOptions
{
    public StripeConnectMode ActiveMode { get; set; } = StripeConnectMode.Test;
    public string FrontendBaseUrl { get; set; } = "";
    public StripeConnectModeOptions Test { get; set; } = new();
    public StripeConnectModeOptions Live { get; set; } = new();

    public StripeConnectModeOptions For(StripeConnectMode mode) => mode switch
    {
        StripeConnectMode.Test => Test,
        StripeConnectMode.Live => Live,
        _ => throw new ArgumentOutOfRangeException(nameof(mode))
    };
}

public sealed class StripeConnectModeOptions
{
    public string ApiKey { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string CallbackUri { get; set; } = "";
    public string WebhookSecret { get; set; } = "";
}

public sealed record StripeConnectOAuthState(string StateHash, Guid TenantId, string OwnerIssuer,
    string OwnerSubject, StripeConnectMode Mode, string Locale, DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt);

public sealed record StripeConnectConnectionSnapshot(Guid TenantId, StripeConnectMode Mode,
    string StripeAccountId, StripeConnectionState ConnectionState, StripeReadinessState ReadinessState,
    StripeAccountReadinessInput Readiness, DateTimeOffset ConnectedAt, DateTimeOffset? LastVerifiedAt,
    DateTimeOffset? LastAppliedEventAt);

public sealed record StripeAccountDetails(string Id, string Type, DateTimeOffset CreatedAt, bool LiveMode,
    StripeAccountReadinessInput Readiness);

public sealed record StripeOAuthExchange(string StripeAccountId, bool LiveMode, string Scope);

public sealed record StripeConnectWebhookEvent(string EventId, string EventType, bool LiveMode,
    DateTimeOffset CreatedAt, string StripeAccountId);

public sealed record StripeConnectStatusDto(string Mode, string ConnectionState, string ReadinessState,
    DateTimeOffset? LastVerifiedAt, bool CanManage, string? DashboardUrl);

public sealed record StripeConnectStartDto(string Mode, string AuthorizationUrl);

public sealed record StripeConnectCallbackDto(Guid? TenantId, string Locale, string Outcome);

public interface IStripeConnectRepository
{
    Task<StripeConnectConnectionSnapshot?> GetConnectionAsync(Guid tenantId, StripeConnectMode mode,
        CancellationToken cancellationToken);
    Task SaveOAuthStateAsync(StripeConnectOAuthState state, CancellationToken cancellationToken);
    Task<StripeConnectOAuthState?> ConsumeOAuthStateAsync(string stateHash, DateTimeOffset now,
        CancellationToken cancellationToken);
    Task<bool> SaveConnectionAsync(StripeConnectConnectionSnapshot connection, DateTimeOffset now,
        CancellationToken cancellationToken);
    Task<bool> UpdateReadinessAsync(Guid tenantId, StripeConnectMode mode, string accountId,
        StripeAccountReadinessInput readiness, StripeReadinessState state, DateTimeOffset verifiedAt,
        CancellationToken cancellationToken);
    Task<bool> ApplyWebhookAsync(StripeConnectWebhookEvent stripeEvent, StripeAccountReadinessInput? readiness,
        StripeReadinessState? readinessState, DateTimeOffset receivedAt, CancellationToken cancellationToken);
}

public interface IStripeConnectProvider
{
    bool IsConfigured(StripeConnectMode mode, StripeConnectOperation operation);
    string CreateAuthorizationUrl(StripeConnectMode mode, string state);
    string DashboardUrl(StripeConnectMode mode);
    Task<StripeOAuthExchange> ExchangeCodeAsync(StripeConnectMode mode, string code,
        CancellationToken cancellationToken);
    Task<StripeAccountDetails> GetAccountAsync(StripeConnectMode mode, string accountId,
        CancellationToken cancellationToken);
    Task DeauthorizeAsync(StripeConnectMode mode, string accountId, CancellationToken cancellationToken);
    StripeConnectWebhookEvent? VerifyWebhook(StripeConnectMode mode, string rawBody, string signature);
}

public sealed class StripeConnectProviderException(string message) : Exception(message);
