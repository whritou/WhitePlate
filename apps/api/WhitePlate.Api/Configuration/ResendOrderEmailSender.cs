using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace WhitePlate.Api.Configuration;

public sealed class ResendOrderEmailSender(IHttpClientFactory clients, IConfiguration configuration)
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(configuration["RESEND_API_KEY"]) &&
                                !string.IsNullOrWhiteSpace(configuration["RESEND_FROM_EMAIL"]);

    public async Task<string> SendAsync(Guid eventId, string recipient, string subject, string html, string text,
        CancellationToken ct)
    {
        var apiKey = configuration["RESEND_API_KEY"];
        var from = configuration["RESEND_FROM_EMAIL"];
        if (string.IsNullOrWhiteSpace(apiKey) || string.IsNullOrWhiteSpace(from))
            throw new InvalidOperationException("Order email delivery is not configured.");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Headers.Add("Idempotency-Key", $"order-event/{eventId:N}");
        request.Content = new StringContent(JsonSerializer.Serialize(new
        {
            from,
            to = new[] { recipient },
            subject,
            html,
            text
        }), Encoding.UTF8, "application/json");

        using var client = clients.CreateClient(nameof(ResendOrderEmailSender));
        client.Timeout = TimeSpan.FromSeconds(15);
        using var response = await client.SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException("The email provider rejected the delivery.", null, response.StatusCode);

        using var document = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct),
            cancellationToken: ct);
        var id = document.RootElement.TryGetProperty("id", out var idValue) ? idValue.GetString() : null;
        if (string.IsNullOrWhiteSpace(id) || id.Length > 200)
            throw new InvalidOperationException("The email provider response did not include a valid message ID.");
        return id;
    }
}
