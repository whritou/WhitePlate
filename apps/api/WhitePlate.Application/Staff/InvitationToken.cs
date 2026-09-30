using System.Security.Cryptography;
using System.Text;

namespace WhitePlate.Application.Staff;

internal static class InvitationToken
{
    public static (string Token, string Hash) Create()
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(token)));
        return (token, hash);
    }

    public static string Hash(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(token))).ToLowerInvariant();
}
