using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Configuration;

public sealed class HmacEmailTrackingCapability(IConfiguration configuration) : IEmailTrackingCapability
{
    private readonly byte[]? _key = ReadKey(configuration["OrderEmails:TrackingSigningKey"]);

    public EmailTrackingCapability? Create(Guid tenantId, Guid orderId, DateTimeOffset expiresAt)
    {
        if (_key is null) return null;

        var payload = Encoding.UTF8.GetBytes($"{tenantId:N}|{orderId:N}|{expiresAt.UtcDateTime.Ticks}");
        var signature = HMACSHA256.HashData(_key, payload);
        var token = Convert.ToBase64String(signature).TrimEnd('=').Replace('+', '-').Replace('/', '_');
        var tokenHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
        return new EmailTrackingCapability(token, tokenHash);
    }

    private static byte[]? ReadKey(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        try
        {
            var key = Convert.FromBase64String(value);
            if (key.Length < 32) throw new InvalidOperationException(
                "OrderEmails:TrackingSigningKey must contain at least 32 bytes encoded as Base64.");
            return key;
        }
        catch (FormatException exception)
        {
            throw new InvalidOperationException(
                "OrderEmails:TrackingSigningKey must contain at least 32 bytes encoded as Base64.", exception);
        }
    }
}
