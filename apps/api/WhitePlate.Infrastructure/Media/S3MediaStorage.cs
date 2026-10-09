using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using WhitePlate.Application.Media;

namespace WhitePlate.Infrastructure.Media;

public sealed record S3MediaOptions(string? Endpoint, string? Region, string? Bucket,
    string? AccessKey, string? SecretKey, bool ForcePathStyle, bool AllowLocalHttp);

public sealed class S3MediaStorage : IMediaStorage, IDisposable
{
    private readonly AmazonS3Client? client;
    private readonly string? bucket;
    public bool IsAvailable => client is not null;

    public S3MediaStorage(S3MediaOptions options)
    {
        if (!Uri.TryCreate(options.Endpoint, UriKind.Absolute, out var endpoint) ||
            !(endpoint.Scheme == "https" || (options.AllowLocalHttp && endpoint.IsLoopback && endpoint.Scheme == "http")) ||
            !string.IsNullOrEmpty(endpoint.UserInfo) || endpoint.AbsolutePath != "/" ||
            !string.IsNullOrEmpty(endpoint.Query) || !string.IsNullOrEmpty(endpoint.Fragment) ||
            string.IsNullOrWhiteSpace(options.Region) || string.IsNullOrWhiteSpace(options.Bucket) ||
            string.IsNullOrWhiteSpace(options.AccessKey) || string.IsNullOrWhiteSpace(options.SecretKey)) return;
        bucket = options.Bucket;
        client = new AmazonS3Client(new BasicAWSCredentials(options.AccessKey, options.SecretKey),
            new AmazonS3Config { ServiceURL = endpoint.AbsoluteUri, AuthenticationRegion = options.Region,
                ForcePathStyle = options.ForcePathStyle, Timeout = TimeSpan.FromSeconds(30), MaxErrorRetry = 2 });
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
