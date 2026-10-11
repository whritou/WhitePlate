using WhitePlate.Infrastructure.Media;

namespace WhitePlate.Tests.Infrastructure;

public sealed class S3MediaStorageTests
{
    [Theory]
    [InlineData(null, false)]
    [InlineData("http://storage.example.test", false)]
    [InlineData("https://user:password@storage.example.test", false)]
    [InlineData("https://storage.example.test/path", false)]
    [InlineData("https://storage.example.test", true)]
    public void MissingOrUnsafeConfigurationCannotEnableStorage(string? endpoint, bool available)
    {
        using var storage = new S3MediaStorage(new(endpoint, "us-east-1", "test-bucket", "test-access", "test-secret", true, false));
        Assert.Equal(available, storage.IsAvailable);
    }

    [Fact]
    public void LoopbackHttpRequiresExplicitLocalOptIn()
    {
        using var disabled = new S3MediaStorage(new("http://localhost:9000", "us-east-1", "test-bucket", "test-access", "test-secret", true, false));
        using var enabled = new S3MediaStorage(new("http://localhost:9000", "us-east-1", "test-bucket", "test-access", "test-secret", true, true));
        Assert.False(disabled.IsAvailable);
        Assert.True(enabled.IsAvailable);
    }

    [Fact]
    public void PrivateHttpRequiresExplicitPrivateOptIn()
    {
        using var disabled = new S3MediaStorage(new("http://minio:9000", "us-east-1", "test-bucket", "test-access", "test-secret", true, false));
        using var enabled = new S3MediaStorage(new("http://minio:9000", "us-east-1", "test-bucket", "test-access", "test-secret", true, false,
            AllowPrivateHttp: true));
        Assert.False(disabled.IsAvailable);
        Assert.True(enabled.IsAvailable);
    }

    [Fact]
    public void PrivateHttpDoesNotAllowPublicDnsNames()
    {
        using var storage = new S3MediaStorage(new("http://storage.example.test", "us-east-1", "test-bucket", "test-access", "test-secret", true, false,
            AllowPrivateHttp: true));
        Assert.False(storage.IsAvailable);
    }

    [Fact]
    public void PrivateHttpRejectsCloudflareAccessTokens()
    {
        using var storage = new S3MediaStorage(new("http://minio:9000", "us-east-1", "test-bucket", "test-access", "test-secret", true, false,
            "client-id", "client-secret", AllowPrivateHttp: true));
        Assert.False(storage.IsAvailable);
    }

    [Fact]
    public void PrivateHttpAcceptsPrivateIpv4Endpoint()
    {
        using var storage = new S3MediaStorage(new("http://10.0.2.2:9000", "us-east-1", "test-bucket", "test-access", "test-secret", true, false,
            AllowPrivateHttp: true));
        Assert.True(storage.IsAvailable);
    }
}
