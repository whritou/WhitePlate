using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using WhitePlate.Application.Orders;

namespace WhitePlate.Api.Configuration;

public sealed class AnalyticsPrivacyService(IConfiguration configuration) : IAnalyticsPrivacyService
{
    private const string Purpose = "whiteplate:analytics-email:v1";

    public AnalyticsFingerprintLookup CreateLookup(Guid tenantId, string? email)
    {
        if (string.IsNullOrWhiteSpace(email) || !TryNormalizeEmail(email, out var normalized))
            return new AnalyticsFingerprintLookup(AnalyticsFingerprintLookupStatus.InvalidEmail, null, []);
        var lookup = BuildLookupHashes(tenantId, normalized);
        return lookup is null
            ? new AnalyticsFingerprintLookup(AnalyticsFingerprintLookupStatus.Unavailable, null, [])
            : new AnalyticsFingerprintLookup(AnalyticsFingerprintLookupStatus.Available,
                lookup.Value.CurrentKeyVersion, lookup.Value.Hashes);
    }

    private (string CurrentKeyVersion, IReadOnlyList<(string KeyVersion, string Hash)> Hashes)?
        BuildLookupHashes(Guid tenantId, string normalized)
    {
        var currentVersion = configuration["Analytics:PrivacyKeyVersion"];
        var currentKey = configuration["Analytics:PrivacyKey"];
        if (string.IsNullOrWhiteSpace(currentVersion) || string.IsNullOrWhiteSpace(currentKey))
            return null;
        var keys = configuration.GetSection("Analytics:PreviousPrivacyKeys").GetChildren()
            .Select(section => (Version: section.Key, Value: section.Value))
            .Where(item => !string.IsNullOrWhiteSpace(item.Version) && !string.IsNullOrWhiteSpace(item.Value))
            .Append((Version: currentVersion, Value: currentKey))
            .ToArray();
        if (keys.Select(item => item.Version).Distinct(StringComparer.Ordinal).Count() != keys.Length)
            return null;

        var message = Encoding.UTF8.GetBytes($"{Purpose}:{tenantId:N}:{normalized}");
        var values = new List<(string KeyVersion, string Hash)>(keys.Length);
        foreach (var (version, value) in keys)
        {
            if (version.Length > 32) return null;
            byte[] key;
            try { key = Convert.FromBase64String(value!); }
            catch (FormatException) { return null; }
            if (key.Length < 32) return null;
            values.Add((version, Convert.ToHexString(HMACSHA256.HashData(key, message)).ToLowerInvariant()));
        }

        return (currentVersion, values.OrderBy(item => item.KeyVersion, StringComparer.Ordinal).ToArray());
    }

    private static bool TryNormalizeEmail(string email, out string normalized)
    {
        normalized = string.Empty;
        var value = email.Trim();
        if (value.Length is 0 or > 254 || value.Any(char.IsWhiteSpace)) return false;
        try
        {
            var parsed = new MailAddress(value);
            if (!string.Equals(parsed.Address, value, StringComparison.OrdinalIgnoreCase) ||
                parsed.DisplayName.Length != 0) return false;
        }
        catch (FormatException) { return false; }
        normalized = value.ToLowerInvariant();
        return true;
    }
}
