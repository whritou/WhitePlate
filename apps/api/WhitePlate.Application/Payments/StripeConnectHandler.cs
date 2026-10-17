using System.Security.Cryptography;
using System.Text;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Payments;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Payments;

public sealed class StripeConnectHandler(IStaffMembershipRepository memberships,
    IStripeConnectRepository repository, IStripeConnectProvider provider,
    StripeConnectOptions options, TimeProvider timeProvider)
{
    private static readonly TimeSpan StateLifetime = TimeSpan.FromMinutes(10);

    public async Task<Result<StripeConnectStatusDto>> GetStatusAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        var isOwner = await memberships.IsOrganizationOwnerOfTenantAsync(tenantId, identity, cancellationToken);
        var canViewBilling = await memberships.HasPermissionAsync(tenantId, identity,
            RestaurantPermission.BillingManage, cancellationToken);
        if (!canViewBilling)
            return Result<StripeConnectStatusDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var mode = options.ActiveMode;
        var connection = await repository.GetConnectionAsync(tenantId, mode, cancellationToken);
        if (connection is null)
            return Result<StripeConnectStatusDto>.Success(new StripeConnectStatusDto(ModeName(mode),
                "not_connected", "unknown", null, isOwner, null));

        var readiness = StripeReadinessState.Unknown;
        var lastVerifiedAt = connection.LastVerifiedAt;
        if (connection.ConnectionState == StripeConnectionState.Connected &&
            provider.IsConfigured(mode, StripeConnectOperation.StatusRead))
        {
            try
            {
                var account = await provider.GetAccountAsync(mode, connection.StripeAccountId, cancellationToken);
                if (account.Id == connection.StripeAccountId && account.LiveMode == (mode == StripeConnectMode.Live))
                {
                    readiness = StripeReadinessClassifier.Classify(account.Readiness);
                    lastVerifiedAt = timeProvider.GetUtcNow();
                    var updated = await repository.UpdateReadinessAsync(tenantId, mode, account.Id,
                        account.Readiness, readiness, lastVerifiedAt.Value, cancellationToken);
                    if (!updated)
                    {
                        connection = await repository.GetConnectionAsync(tenantId, mode, cancellationToken);
                        if (connection?.ConnectionState != StripeConnectionState.Connected ||
                            connection.StripeAccountId != account.Id)
                        {
                            readiness = StripeReadinessState.Unknown;
                            lastVerifiedAt = connection?.LastVerifiedAt;
                        }
                    }
                }
            }
            catch (StripeConnectProviderException)
            {
                readiness = StripeReadinessState.Unknown;
            }
            catch (HttpRequestException)
            {
                readiness = StripeReadinessState.Unknown;
            }
        }

        if (connection is null)
            return Result<StripeConnectStatusDto>.Success(new StripeConnectStatusDto(ModeName(mode),
                "not_connected", "unknown", null, isOwner, null));
        var state = connection.ConnectionState == StripeConnectionState.Disconnected
            ? "disconnected" : "connected";
        return Result<StripeConnectStatusDto>.Success(new StripeConnectStatusDto(ModeName(mode), state,
            StateName(readiness), lastVerifiedAt, isOwner,
            isOwner && connection.ConnectionState == StripeConnectionState.Connected ? provider.DashboardUrl(mode) : null));
    }

    public async Task<Result<StripeConnectStartDto>> StartOAuthAsync(Guid tenantId, ExternalIdentity identity,
        string? locale, CancellationToken cancellationToken)
    {
        if (!await memberships.IsOrganizationOwnerOfTenantAsync(tenantId, identity, cancellationToken))
            return Result<StripeConnectStartDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var mode = options.ActiveMode;
        var existing = await repository.GetConnectionAsync(tenantId, mode, cancellationToken);
        if (existing?.ConnectionState == StripeConnectionState.Connected)
            return Result<StripeConnectStartDto>.Failure(new ApplicationError(ErrorCode.Conflict));
        if (!provider.IsConfigured(mode, StripeConnectOperation.OAuth) || !HasSafeFrontendBaseUrl())
            return Result<StripeConnectStartDto>.Failure(new ApplicationError(ErrorCode.Unavailable));

        var state = CreateState();
        var now = timeProvider.GetUtcNow();
        await repository.SaveOAuthStateAsync(new StripeConnectOAuthState(HashState(state), tenantId,
            identity.Issuer, identity.Subject, mode, NormalizeLocale(locale), now, now.Add(StateLifetime)),
            cancellationToken);
        return Result<StripeConnectStartDto>.Success(new StripeConnectStartDto(ModeName(mode),
            provider.CreateAuthorizationUrl(mode, state)));
    }

    public async Task<StripeConnectCallbackDto> CompleteOAuthAsync(string? state, string? code, string? error,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(state)) return FailedCallback();
        var consumed = await repository.ConsumeOAuthStateAsync(HashState(state), timeProvider.GetUtcNow(), cancellationToken);
        if (consumed is null) return FailedCallback();
        var fallback = new StripeConnectCallbackDto(consumed.TenantId, consumed.Locale, "failed");
        if (!string.IsNullOrWhiteSpace(error)) return fallback with { Outcome = "canceled" };
        if (string.IsNullOrWhiteSpace(code)) return fallback;

        ExternalIdentity initiatingOwner;
        try { initiatingOwner = ExternalIdentity.Create(consumed.OwnerIssuer, consumed.OwnerSubject); }
        catch (Exception) { return fallback; }
        if (!await memberships.IsOrganizationOwnerOfTenantAsync(consumed.TenantId, initiatingOwner, cancellationToken))
            return fallback with { Outcome = "owner_required" };
        if (!provider.IsConfigured(consumed.Mode, StripeConnectOperation.OAuth)) return fallback;

        try
        {
            // A Stripe OAuth code is single-use. There is deliberately no retry here.
            var exchange = await provider.ExchangeCodeAsync(consumed.Mode, code, cancellationToken);
            if (exchange.LiveMode != (consumed.Mode == StripeConnectMode.Live) || exchange.Scope != "read_write")
                return fallback;

            var account = await provider.GetAccountAsync(consumed.Mode, exchange.StripeAccountId, cancellationToken);
            if (account.LiveMode != exchange.LiveMode || account.Id != exchange.StripeAccountId)
                return fallback;
            if (!string.Equals(account.Type, "standard", StringComparison.OrdinalIgnoreCase))
                return fallback;

            var now = timeProvider.GetUtcNow();
            var readiness = StripeReadinessClassifier.Classify(account.Readiness);
            var snapshot = new StripeConnectConnectionSnapshot(consumed.TenantId, consumed.Mode, account.Id,
                StripeConnectionState.Connected, readiness, account.Readiness, now, now, null);
            if (!await repository.SaveConnectionAsync(snapshot, now, cancellationToken))
                return fallback;
            return fallback with { Outcome = "connected" };
        }
        catch (StripeConnectProviderException)
        {
            return fallback;
        }
        catch (HttpRequestException)
        {
            return fallback;
        }
    }

    public async Task<bool> ProcessWebhookAsync(StripeConnectMode mode, string rawBody, string signature,
        CancellationToken cancellationToken)
    {
        if (!provider.IsConfigured(mode, StripeConnectOperation.Webhook)) return false;
        var stripeEvent = provider.VerifyWebhook(mode, rawBody, signature);
        if (stripeEvent is null || stripeEvent.LiveMode != (mode == StripeConnectMode.Live)) return false;

        StripeAccountReadinessInput? readiness = null;
        StripeReadinessState? state = null;
        if (stripeEvent.EventType == "account.updated")
        {
            if (!provider.IsConfigured(mode, StripeConnectOperation.StatusRead)) return false;
            try
            {
                var account = await provider.GetAccountAsync(mode, stripeEvent.StripeAccountId, cancellationToken);
                if (account.Id != stripeEvent.StripeAccountId || account.LiveMode != stripeEvent.LiveMode) return false;
                readiness = account.Readiness;
                state = StripeReadinessClassifier.Classify(readiness);
            }
            catch (StripeConnectProviderException) { return false; }
            catch (HttpRequestException) { return false; }
        }
        else if (stripeEvent.EventType != "account.application.deauthorized")
        {
            return true;
        }

        return await repository.ApplyWebhookAsync(stripeEvent, readiness, state, timeProvider.GetUtcNow(),
            cancellationToken);
    }

    private static string CreateState() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .TrimEnd('=').Replace('+', '-').Replace('/', '_');

    private static string HashState(string state) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(state)))
        .ToLowerInvariant();

    private static string NormalizeLocale(string? locale) => locale?.Trim().ToLowerInvariant() switch
    {
        "fr" => "fr",
        _ => "en"
    };

    private static StripeConnectCallbackDto FailedCallback() => new(null, "en", "failed");

    private bool HasSafeFrontendBaseUrl() => Uri.TryCreate(options.FrontendBaseUrl, UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttps || uri.IsLoopback && uri.Scheme == Uri.UriSchemeHttp);

    private static string ModeName(StripeConnectMode mode) => mode == StripeConnectMode.Test ? "test" : "live";

    private static string StateName(StripeReadinessState state) => state switch
    {
        StripeReadinessState.Onboarding => "onboarding",
        StripeReadinessState.ActionRequired => "action_required",
        StripeReadinessState.PendingVerification => "pending_verification",
        StripeReadinessState.Restricted => "restricted",
        StripeReadinessState.Verified => "verified",
        _ => "unknown"
    };
}
