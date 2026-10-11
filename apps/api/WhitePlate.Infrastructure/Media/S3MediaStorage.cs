using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using System.Net;
using WhitePlate.Application.Media;

namespace WhitePlate.Infrastructure.Media;

public sealed record S3MediaOptions(string? Endpoint, string? Region, string? Bucket,
    string? AccessKey, string? SecretKey, bool ForcePathStyle, bool AllowLocalHttp,
    string? AccessServiceTokenClientId = null, string? AccessServiceTokenClientSecret = null,
    bool AllowPrivateHttp = false);

public sealed class S3MediaStorage : IMediaStorage, IDisposable
{
    private readonly AmazonS3Client? client;
    private readonly string? bucket;
    public bool IsAvailable => client is not null;

    public S3MediaStorage(S3MediaOptions options)
    {
        var hasAccessServiceToken = !string.IsNullOrWhiteSpace(options.AccessServiceTokenClientId) ||
            !string.IsNullOrWhiteSpace(options.AccessServiceTokenClientSecret);
        var isHttpAllowed = Uri.TryCreate(options.Endpoint, UriKind.Absolute, out var parsedEndpoint) &&
            parsedEndpoint.Scheme == "http" &&
            (options.AllowLocalHttp && parsedEndpoint.IsLoopback || options.AllowPrivateHttp && IsPrivateHttpHost(parsedEndpoint));
        var isPrivateHttpWithAccessToken = isHttpAllowed && !parsedEndpoint!.IsLoopback && hasAccessServiceToken;
        if (!Uri.TryCreate(options.Endpoint, UriKind.Absolute, out var endpoint) ||
            !(endpoint.Scheme == "https" || isHttpAllowed) || isPrivateHttpWithAccessToken ||
            !string.IsNullOrEmpty(endpoint.UserInfo) || endpoint.AbsolutePath != "/" ||
            !string.IsNullOrEmpty(endpoint.Query) || !string.IsNullOrEmpty(endpoint.Fragment) ||
            string.IsNullOrWhiteSpace(options.Region) || string.IsNullOrWhiteSpace(options.Bucket) ||
            string.IsNullOrWhiteSpace(options.AccessKey) || string.IsNullOrWhiteSpace(options.SecretKey) ||
            hasAccessServiceToken && (string.IsNullOrWhiteSpace(options.AccessServiceTokenClientId) ||
                string.IsNullOrWhiteSpace(options.AccessServiceTokenClientSecret))) return;
        bucket = options.Bucket;
        client = new AmazonS3Client(new BasicAWSCredentials(options.AccessKey, options.SecretKey),
            new AmazonS3Config { ServiceURL = endpoint.AbsoluteUri, AuthenticationRegion = options.Region,
                ForcePathStyle = options.ForcePathStyle, Timeout = TimeSpan.FromSeconds(30), MaxErrorRetry = 2 });

        if (hasAccessServiceToken)
        {
            var clientId = options.AccessServiceTokenClientId!;
            var clientSecret = options.AccessServiceTokenClientSecret!;
            client.BeforeRequestEvent += (_, args) =>
            {
                if (args is not WebServiceRequestEventArgs request) return;
                request.Headers["CF-Access-Client-Id"] = clientId;
                request.Headers["CF-Access-Client-Secret"] = clientSecret;
            };
        }
    }

    private static bool IsPrivateHttpHost(Uri endpoint)
    {
        if (endpoint.IsLoopback) return false;
        if (IPAddress.TryParse(endpoint.Host, out var address))
        {
            if (address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
            {
                var bytes = address.GetAddressBytes();
                return bytes[0] == 10 || bytes[0] == 172 && bytes[1] is >= 16 and <= 31 ||
                    bytes[0] == 192 && bytes[1] == 168 || bytes[0] == 169 && bytes[1] == 254;
            }
            return address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || address.IsIPv6UniqueLocal;
        }

        // Docker service aliases such as "minio" are private-network names; public DNS names are not.
        return !endpoint.Host.Contains('.') && !endpoint.Host.Contains(':');
    }

    public async Task PutAsync(string key, byte[] bytes, string contentType, CancellationToken ct)
    {
        if (client is null) throw new MediaUnavailableException();
        try
        {
            using var stream = new MemoryStream(bytes, writable: false);
            await client.PutObjectAsync(new PutObjectRequest { BucketName = bucket, Key = key,
                InputStream = stream, ContentType = contentType, AutoCloseStream = false }, ct);
        }
        catch (Exception exception) when (exception is AmazonS3Exception or AmazonClientException or HttpRequestException or IOException ||
            exception is OperationCanceledException && !ct.IsCancellationRequested)
        { throw new MediaUnavailableException(); }
    }

    public async Task<byte[]> GetAsync(string key, CancellationToken ct)
    {
        if (client is null) throw new MediaUnavailableException();
        try
        {
            using var response = await client.GetObjectAsync(bucket, key, ct);
            if (response.ContentLength > 8 * 1024 * 1024) throw new MediaUnavailableException();
            using var bytes = new MemoryStream();
            var buffer = new byte[64 * 1024];
            int read;
            while ((read = await response.ResponseStream.ReadAsync(buffer, ct)) > 0)
            {
                if (bytes.Length + read > 8 * 1024 * 1024) throw new MediaUnavailableException();
                await bytes.WriteAsync(buffer.AsMemory(0, read), ct);
            }
            return bytes.ToArray();
        }
        catch (Exception exception) when (exception is AmazonS3Exception or AmazonClientException or HttpRequestException or IOException ||
            exception is OperationCanceledException && !ct.IsCancellationRequested)
        { throw new MediaUnavailableException(); }
    }

    public async Task DeleteAsync(string key, CancellationToken ct)
    {
        if (client is null) throw new MediaUnavailableException();
        try { await client.DeleteObjectAsync(bucket, key, ct); }
        catch (Exception exception) when (exception is AmazonS3Exception or AmazonClientException or HttpRequestException or IOException ||
            exception is OperationCanceledException && !ct.IsCancellationRequested)
        { throw new MediaUnavailableException(); }
    }

    public void Dispose() => client?.Dispose();
}
