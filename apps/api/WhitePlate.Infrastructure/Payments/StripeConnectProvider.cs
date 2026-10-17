using System.Net.Http.Headers;
using System.Text.Json;
using Stripe;
using WhitePlate.Application.Payments;
using WhitePlate.Domain.Payments;

namespace WhitePlate.Infrastructure.Payments;

public sealed class StripeConnectProvider(IHttpClientFactory clients, StripeConnectOptions options)
    : IStripeConnectProvider
{
    private const string ApiBaseAddress = "https://api.stripe.com/";
    private const string ConnectBaseAddress = "https://connect.stripe.com/";

    public bool IsConfigured(StripeConnectMode mode, StripeConnectOperation operation)
    {
        var settings = options.For(mode);
        return operation switch
        {
            StripeConnectOperation.StatusRead => HasModeKey(settings.ApiKey, mode),
            StripeConnectOperation.OAuth => HasModeKey(settings.ApiKey, mode) &&
                !string.IsNullOrWhiteSpace(settings.ClientId) && IsAllowedCallback(settings.CallbackUri),
            StripeConnectOperation.Webhook => HasModeKey(settings.ApiKey, mode) &&
                !string.IsNullOrWhiteSpace(settings.WebhookSecret) && settings.WebhookSecret.StartsWith("whsec_", StringComparison.Ordinal),
            _ => false
        };
    }

    public string CreateAuthorizationUrl(StripeConnectMode mode, string state)
    {
        if (!IsConfigured(mode, StripeConnectOperation.OAuth))
            throw new StripeConnectProviderException("Stripe OAuth is not configured for this mode.");
        var settings = options.For(mode);
        var query = new Dictionary<string, string>
        {
            ["client_id"] = settings.ClientId,
            ["response_type"] = "code",
            ["scope"] = "read_write",
            ["redirect_uri"] = settings.CallbackUri,
            ["state"] = state
        };
        return $"{ConnectBaseAddress}oauth/authorize?{string.Join('&', query.Select(pair =>
            $"{Uri.EscapeDataString(pair.Key)}={Uri.EscapeDataString(pair.Value)}"))}";
    }

    public string DashboardUrl(StripeConnectMode mode) => mode == StripeConnectMode.Test
        ? "https://dashboard.stripe.com/test"
        : "https://dashboard.stripe.com/";

    public async Task<StripeOAuthExchange> ExchangeCodeAsync(StripeConnectMode mode, string code,
        CancellationToken cancellationToken)
    {
        var settings = options.For(mode);
        using var client = clients.CreateClient("StripeConnectOAuth");
        using var request = new HttpRequestMessage(HttpMethod.Post, "oauth/token")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_secret"] = settings.ApiKey,
                ["code"] = code,
                ["grant_type"] = "authorization_code"
            })
        };
        using var response = await SendAsync(client, request, cancellationToken);
        using var document = await ReadJsonAsync(response, cancellationToken);
        var root = document.RootElement;
        return new StripeOAuthExchange(ReadRequiredString(root, "stripe_user_id"),
            ReadBoolean(root, "livemode"), ReadOptionalString(root, "scope") ?? "");
    }

    public async Task<StripeAccountDetails> GetAccountAsync(StripeConnectMode mode, string accountId,
        CancellationToken cancellationToken)
    {
        var settings = options.For(mode);
        using var client = clients.CreateClient("StripeConnectApi");
        using var request = new HttpRequestMessage(HttpMethod.Get,
            $"v1/accounts/{Uri.EscapeDataString(accountId)}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", settings.ApiKey);
        using var response = await SendAsync(client, request, cancellationToken);
        using var document = await ReadJsonAsync(response, cancellationToken);
        var root = document.RootElement;
        var requirements = root.TryGetProperty("requirements", out var req) ? req : default;
        var capabilityStatus = root.TryGetProperty("capabilities", out var caps) &&
            caps.TryGetProperty("card_payments", out var capability)
                ? capability.GetString() : null;
        var readiness = new StripeAccountReadinessInput(
            ReadBoolean(root, "details_submitted"),
            ReadBoolean(root, "charges_enabled"),
            ReadBoolean(root, "payouts_enabled"),
            capabilityStatus,
            ArrayLength(requirements, "currently_due"),
            ArrayLength(requirements, "past_due"),
            ArrayLength(requirements, "pending_verification"));
        var createdSeconds = ReadInt64(root, "created");
        return new StripeAccountDetails(ReadRequiredString(root, "id"),
            ReadOptionalString(root, "type") ?? "", DateTimeOffset.FromUnixTimeSeconds(createdSeconds),
            ReadBoolean(root, "livemode"), readiness);
    }

    public async Task DeauthorizeAsync(StripeConnectMode mode, string accountId,
        CancellationToken cancellationToken)
    {
        var settings = options.For(mode);
        using var client = clients.CreateClient("StripeConnectOAuth");
        using var request = new HttpRequestMessage(HttpMethod.Post, "oauth/deauthorize")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = settings.ClientId,
                ["stripe_user_id"] = accountId,
                ["client_secret"] = settings.ApiKey
            })
        };
        using var response = await SendAsync(client, request, cancellationToken);
    }

    public StripeConnectWebhookEvent? VerifyWebhook(StripeConnectMode mode, string rawBody, string signature)
    {
        var secret = options.For(mode).WebhookSecret;
        try
        {
            _ = EventUtility.ConstructEvent(rawBody, signature, secret);
            using var document = JsonDocument.Parse(rawBody);
            var root = document.RootElement;
            var eventType = ReadRequiredString(root, "type");
            var id = ReadRequiredString(root, "id");
            var livemode = ReadBoolean(root, "livemode");
            var created = DateTimeOffset.FromUnixTimeSeconds(ReadInt64(root, "created"));
            var accountId = eventType == "account.application.deauthorized"
                ? ReadOptionalString(root, "account")
                : root.GetProperty("data").GetProperty("object").GetProperty("id").GetString();
            if (string.IsNullOrWhiteSpace(accountId)) return null;
            return new StripeConnectWebhookEvent(id, eventType, livemode, created, accountId);
        }
        catch (StripeException) { return null; }
        catch (JsonException) { return null; }
        catch (KeyNotFoundException) { return null; }
        catch (InvalidOperationException) { return null; }
        catch (FormatException) { return null; }
    }

    private static async Task<HttpResponseMessage> SendAsync(HttpClient client, HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        try
        {
            var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                response.Dispose();
                throw new StripeConnectProviderException("Stripe request failed.");
            }
            return response;
        }
        catch (HttpRequestException)
        {
            throw new StripeConnectProviderException("Stripe is unavailable.");
        }
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        try
        {
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            return await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        }
        catch (JsonException)
        {
            throw new StripeConnectProviderException("Stripe returned an invalid response.");
        }
    }

    private static bool HasModeKey(string? value, StripeConnectMode mode) => mode switch
    {
        StripeConnectMode.Test => value?.StartsWith("sk_test_", StringComparison.Ordinal) == true,
        StripeConnectMode.Live => value?.StartsWith("sk_live_", StringComparison.Ordinal) == true,
        _ => false
    };

    private static bool IsAllowedCallback(string? callback)
    {
        if (!Uri.TryCreate(callback, UriKind.Absolute, out var uri) || uri.Scheme is not ("https" or "http"))
            return false;
        return uri.Scheme == "https" || uri.IsLoopback;
    }

    private static string ReadRequiredString(JsonElement element, string property)
    {
        var value = ReadOptionalString(element, property);
        return !string.IsNullOrWhiteSpace(value) ? value : throw new StripeConnectProviderException("Stripe response is incomplete.");
    }

    private static string? ReadOptionalString(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(property, out var value) &&
        value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private static bool ReadBoolean(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(property, out var value) &&
        value.ValueKind is JsonValueKind.True;

    private static long ReadInt64(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(property, out var value) &&
        value.TryGetInt64(out var number) ? number : throw new StripeConnectProviderException("Stripe response is incomplete.");

    private static int ArrayLength(JsonElement element, string property) =>
        element.ValueKind == JsonValueKind.Object && element.TryGetProperty(property, out var value) &&
        value.ValueKind == JsonValueKind.Array ? value.GetArrayLength() : 0;
}
