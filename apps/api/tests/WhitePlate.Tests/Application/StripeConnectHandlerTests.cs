using System.Security.Cryptography;
using System.Text;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Payments;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Payments;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class StripeConnectHandlerTests
{
    private static readonly ExternalIdentity Owner = ExternalIdentity.Create("https://identity.example.test/", "owner");
    private static readonly ExternalIdentity Manager = ExternalIdentity.Create("https://identity.example.test/", "manager");
    private readonly Guid tenantId = Guid.NewGuid();

    [Fact]
    public async Task OwnerCanStartTestModeOAuthAndOnlyStateDigestIsStored()
    {
        var memberships = new Memberships { Owner = Owner };
        var store = new Store();
        var provider = new Provider();
        var handler = CreateHandler(memberships, store, provider);

        var result = await handler.StartOAuthAsync(tenantId, Owner, "fr", TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("test", result.Value.Mode);
        Assert.Contains("https://connect.stripe.com/oauth/authorize", result.Value.AuthorizationUrl);
        Assert.Contains("scope=read_write", result.Value.AuthorizationUrl);
        Assert.NotNull(store.SavedState);
        Assert.Equal(StripeConnectMode.Test, store.SavedState.Mode);
        Assert.Equal(tenantId, store.SavedState.TenantId);
        Assert.Equal("fr", store.SavedState.Locale);
        Assert.Equal(64, store.SavedState.StateHash.Length);
        Assert.DoesNotContain(store.SavedState.StateHash, result.Value.AuthorizationUrl);
    }

    [Fact]
    public async Task ManagerCanReadStatusButCannotStartOAuth()
    {
        var memberships = new Memberships { Manager = Manager };
        var handler = CreateHandler(memberships, new Store(), new Provider());

        var status = await handler.GetStatusAsync(tenantId, Manager, TestContext.Current.CancellationToken);
        var start = await handler.StartOAuthAsync(tenantId, Manager, "en", TestContext.Current.CancellationToken);

        Assert.True(status.IsSuccess);
        Assert.Equal("not_connected", status.Value.ConnectionState);
        Assert.False(status.Value.CanManage);
        Assert.False(start.IsSuccess);
    }

    [Fact]
    public async Task ActiveConnectionCannotBeReplaced()
    {
        var memberships = new Memberships { Owner = Owner };
        var store = new Store
        {
            Connection = new StripeConnectConnectionSnapshot(tenantId, StripeConnectMode.Test, "acct_existing",
                StripeConnectionState.Connected, StripeReadinessState.Verified,
                new StripeAccountReadinessInput(true, true, true, "active", 0, 0, 0),
                DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, null)
        };
        var handler = CreateHandler(memberships, store, new Provider());

        var start = await handler.StartOAuthAsync(tenantId, Owner, "en", TestContext.Current.CancellationToken);

        Assert.False(start.IsSuccess);
        Assert.Null(store.SavedState);
    }

    [Fact]
    public async Task CallbackConsumesCancellationStateWithoutExchangingCode()
    {
        var state = CallbackState();
        var store = new Store { OAuthState = state };
        var provider = new Provider();
        var handler = CreateHandler(new Memberships { Owner = Owner }, store, provider);

        var result = await handler.CompleteOAuthAsync("known-state", null, "access_denied",
            TestContext.Current.CancellationToken);
        var replay = await handler.CompleteOAuthAsync("known-state", "code", null,
            TestContext.Current.CancellationToken);

        Assert.Equal("canceled", result.Outcome);
        Assert.Equal("failed", replay.Outcome);
        Assert.Equal(0, provider.ExchangeCount);
    }

    [Fact]
    public async Task CallbackLinksAStandardAccountCreatedDuringOAuthAndKeepsItsOnboardingStatus()
    {
        var state = CallbackState();
        var store = new Store { OAuthState = state };
        var provider = new Provider
        {
            Account = new StripeAccountDetails("acct_new", "standard", DateTimeOffset.UtcNow.AddMinutes(1),
                false, new StripeAccountReadinessInput(false, false, false, "inactive", 0, 0, 0))
        };
        var handler = CreateHandler(new Memberships { Owner = Owner }, store, provider);

        var result = await handler.CompleteOAuthAsync("known-state", "one-use-code", null,
            TestContext.Current.CancellationToken);

        Assert.Equal("connected", result.Outcome);
        Assert.Equal(1, provider.ExchangeCount);
        Assert.NotNull(store.SavedConnection);
        Assert.Equal("acct_new", store.SavedConnection.StripeAccountId);
        Assert.Equal(StripeReadinessState.Onboarding, store.SavedConnection.ReadinessState);
    }

    [Fact]
    public async Task CallbackLinksAPreexistingStandardAccountAfterModeAndScopeChecks()
    {
        var state = CallbackState();
        var store = new Store { OAuthState = state };
        var provider = new Provider
        {
            Account = new StripeAccountDetails("acct_existing", "standard", DateTimeOffset.UtcNow.AddDays(-1),
                false, new StripeAccountReadinessInput(true, true, true, "active", 0, 0, 0))
        };
        var handler = CreateHandler(new Memberships { Owner = Owner }, store, provider);

        var result = await handler.CompleteOAuthAsync("known-state", "one-use-code", null,
            TestContext.Current.CancellationToken);

        Assert.Equal("connected", result.Outcome);
        Assert.Equal(1, provider.ExchangeCount);
        Assert.NotNull(store.SavedConnection);
        Assert.Equal("acct_existing", store.SavedConnection.StripeAccountId);
        Assert.Equal(StripeReadinessState.Verified, store.SavedConnection.ReadinessState);
    }

    [Fact]
    public async Task CallbackDoesNotExchangeAfterTheInitiatingUserLosesOwnership()
    {
        var store = new Store { OAuthState = CallbackState() };
        var provider = new Provider();
        var handler = CreateHandler(new Memberships(), store, provider);

        var result = await handler.CompleteOAuthAsync("known-state", "one-use-code", null,
            TestContext.Current.CancellationToken);

        Assert.Equal("owner_required", result.Outcome);
        Assert.Equal(0, provider.ExchangeCount);
    }

    private static StripeConnectOAuthState CallbackState()
    {
        var now = DateTimeOffset.UtcNow;
        return new StripeConnectOAuthState(HashState("known-state"), Guid.NewGuid(), Owner.Issuer,
            Owner.Subject, StripeConnectMode.Test, "fr", now.AddMinutes(-1), now.AddMinutes(9));
    }

    private static string HashState(string state) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(state))).ToLowerInvariant();

    private StripeConnectHandler CreateHandler(Memberships memberships, Store store, Provider provider) =>
        new(memberships, store, provider, new StripeConnectOptions
        {
            ActiveMode = StripeConnectMode.Test,
            FrontendBaseUrl = "http://localhost:3000"
        }, TimeProvider.System);

    private sealed class Memberships : IStaffMembershipRepository
    {
        public ExternalIdentity? Owner { get; init; }
        public ExternalIdentity? Manager { get; init; }

        public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken) =>
            Task.FromResult(Owner == identity);
        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid candidateTenantId, ExternalIdentity identity, CancellationToken cancellationToken) =>
            Task.FromResult(candidateTenantId == Guid.Empty ? false : Owner == identity);
        public Task<bool> HasRestaurantRoleAsync(Guid candidateTenantId, ExternalIdentity identity, RestaurantRole role, CancellationToken cancellationToken) =>
            Task.FromResult(role == RestaurantRole.Manager && Manager == identity);
    }

    private sealed class Store : IStripeConnectRepository
    {
        public StripeConnectOAuthState? SavedState { get; private set; }
        public StripeConnectConnectionSnapshot? Connection { get; init; }
        public StripeConnectOAuthState? OAuthState { get; init; }
        public StripeConnectConnectionSnapshot? SavedConnection { get; private set; }
        private bool consumed;

        public Task<StripeConnectConnectionSnapshot?> GetConnectionAsync(Guid candidateTenantId, StripeConnectMode mode, CancellationToken cancellationToken) =>
            Task.FromResult(Connection is not null && Connection.TenantId == candidateTenantId && Connection.Mode == mode ? Connection : null);
        public Task SaveOAuthStateAsync(StripeConnectOAuthState state, CancellationToken cancellationToken)
        {
            SavedState = state;
            return Task.CompletedTask;
        }
        public Task<StripeConnectOAuthState?> ConsumeOAuthStateAsync(string stateHash, DateTimeOffset now, CancellationToken cancellationToken)
        {
            if (consumed || OAuthState is null || OAuthState.StateHash != stateHash || OAuthState.ExpiresAt <= now)
                return Task.FromResult<StripeConnectOAuthState?>(null);
            consumed = true;
            return Task.FromResult<StripeConnectOAuthState?>(OAuthState);
        }
        public Task<bool> SaveConnectionAsync(StripeConnectConnectionSnapshot connection, DateTimeOffset now, CancellationToken cancellationToken)
        {
            SavedConnection = connection;
            return Task.FromResult(true);
        }
        public Task<bool> UpdateReadinessAsync(Guid tenantId, StripeConnectMode mode, string accountId,
            StripeAccountReadinessInput readiness, StripeReadinessState state, DateTimeOffset verifiedAt,
            CancellationToken cancellationToken) => Task.FromResult(true);
        public Task<bool> ApplyWebhookAsync(StripeConnectWebhookEvent stripeEvent, StripeAccountReadinessInput? readiness,
            StripeReadinessState? readinessState, DateTimeOffset receivedAt, CancellationToken cancellationToken) => Task.FromResult(true);
    }

    private sealed class Provider : IStripeConnectProvider
    {
        public string CreateAuthorizationUrl(StripeConnectMode mode, string state) =>
            $"https://connect.stripe.com/oauth/authorize?scope=read_write&state={Uri.EscapeDataString(state)}";
        public string DashboardUrl(StripeConnectMode mode) => mode == StripeConnectMode.Test
            ? "https://dashboard.stripe.com/test" : "https://dashboard.stripe.com/";
        public int ExchangeCount { get; private set; }
        public StripeAccountDetails Account { get; init; } = new("acct_existing", "standard",
            DateTimeOffset.UtcNow.AddDays(-1), false,
            new StripeAccountReadinessInput(true, true, true, "active", 0, 0, 0));
        public bool IsConfigured(StripeConnectMode mode, StripeConnectOperation operation) => true;
        public Task<StripeOAuthExchange> ExchangeCodeAsync(StripeConnectMode mode, string code, CancellationToken cancellationToken) =>
            RecordExchange(mode);
        private Task<StripeOAuthExchange> RecordExchange(StripeConnectMode mode)
        {
            ExchangeCount++;
            return Task.FromResult(new StripeOAuthExchange(Account.Id, mode == StripeConnectMode.Live, "read_write"));
        }
        public Task<StripeAccountDetails> GetAccountAsync(StripeConnectMode mode, string accountId, CancellationToken cancellationToken) =>
            Task.FromResult(Account);
        public StripeConnectWebhookEvent? VerifyWebhook(StripeConnectMode mode, string rawBody, string signature) => null;
    }
}
