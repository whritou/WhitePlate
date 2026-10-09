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
}
