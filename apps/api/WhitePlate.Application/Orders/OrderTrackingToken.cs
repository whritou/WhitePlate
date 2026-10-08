using System.Security.Cryptography;
using System.Text;

namespace WhitePlate.Application.Orders;

public static class OrderTrackingToken
{
    public static bool TryHash(string? token, out string hash)
    {
        hash = string.Empty;
        if (token is null || token.Length != 43 || token.Any(character =>
                !(character is >= 'A' and <= 'Z' or >= 'a' and <= 'z' or >= '0' and <= '9' or '-' or '_')))
            return false;

        try
        {
            var decoded = Convert.FromBase64String(token.Replace('-', '+').Replace('_', '/') + "=");
            if (decoded.Length != 32) return false;
            hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
