using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WhitePlate.Application.Payments;
using WhitePlate.Domain.Payments;
using WhitePlate.Infrastructure.Payments;

namespace WhitePlate.Tests.Infrastructure;

public sealed class StripeConnectProviderTests
{
    private const string WebhookSecret = "whsec_test_secret";

    [Fact]
    public void TestModeAuthorizationUsesConfiguredClientAndFixedReadWriteScope()
    {
        var provider = CreateProvider();

        Assert.True(provider.IsConfigured(StripeConnectMode.Test, StripeConnectOperation.OAuth));
        var uri = new Uri(provider.CreateAuthorizationUrl(StripeConnectMode.Test, "random-state"));
        var query = uri.Query;

        Assert.Equal("https://connect.stripe.com", uri.GetLeftPart(UriPartial.Authority));
        Assert.Contains("client_id=ca_test_123", query);
        Assert.Contains("response_type=code", query);
        Assert.Contains("scope=read_write", query);
        Assert.Contains("redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fv1%2Fstripe-connect%2Foauth%2Fcallback", query);
        Assert.Contains("state=random-state", query);
    }

    [Fact]
    public void TestAndLiveCredentialModesCannotBeMixed()
    {
        var options = Options();
        options.Live.ApiKey = "sk_test_wrong_mode";
        var provider = new StripeConnectProvider(new EmptyHttpClientFactory(), options);

        Assert.True(provider.IsConfigured(StripeConnectMode.Test, StripeConnectOperation.StatusRead));
        Assert.False(provider.IsConfigured(StripeConnectMode.Live, StripeConnectOperation.StatusRead));
    }

    [Fact]
    public void WebhookMustHaveStripeSignatureForExactRawBody()
    {
        var provider = CreateProvider();
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var rawBody = JsonSerializer.Serialize(new
        {
            id = "evt_test",
            @object = "event",
            api_version = "2026-09-30.endive",
            created = now,
            data = new { @object = new { id = "acct_test", @object = "account" } },
            livemode = false,
            pending_webhooks = 1,
            type = "account.updated"
        });
        var signature = Signature(rawBody, WebhookSecret, now);

        var verified = provider.VerifyWebhook(StripeConnectMode.Test, rawBody, signature);
        var invalid = provider.VerifyWebhook(StripeConnectMode.Test, rawBody + " ", signature);

        Assert.NotNull(verified);
        Assert.Equal("evt_test", verified.EventId);
        Assert.Equal("account.updated", verified.EventType);
        Assert.Equal("acct_test", verified.StripeAccountId);
        Assert.False(verified.LiveMode);
        Assert.Null(invalid);
    }

    private static StripeConnectProvider CreateProvider() =>
        new(new EmptyHttpClientFactory(), Options());

    private static StripeConnectOptions Options() => new()
    {
        ActiveMode = StripeConnectMode.Test,
        FrontendBaseUrl = "http://localhost:3000",
        Test = new StripeConnectModeOptions
        {
            ApiKey = "sk_test_example",
            ClientId = "ca_test_123",
            CallbackUri = "http://localhost:5000/api/v1/stripe-connect/oauth/callback",
            WebhookSecret = WebhookSecret
        },
        Live = new StripeConnectModeOptions
        {
            ApiKey = "sk_live_example",
            ClientId = "ca_live_123",
            CallbackUri = "https://api.example.test/api/v1/stripe-connect/oauth/callback",
            WebhookSecret = "whsec_live_secret"
        }
    };

    private static string Signature(string body, string secret, long timestamp)
    {
        var signedPayload = Encoding.UTF8.GetBytes($"{timestamp}.{body}");
        var key = Encoding.UTF8.GetBytes(secret);
        var digest = HMACSHA256.HashData(key, signedPayload);
        return $"t={timestamp},v1={Convert.ToHexString(digest).ToLowerInvariant()}";
    }

    private sealed class EmptyHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
    }
}
