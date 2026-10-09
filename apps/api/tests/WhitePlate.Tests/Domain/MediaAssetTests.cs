using WhitePlate.Domain.Media;

namespace WhitePlate.Tests.Domain;

public sealed class MediaAssetTests
{
    [Fact]
    public void ANewUploadIsPrivateAndCannotBeActivatedBeforeStorageCompletes()
    {
        var asset = MediaAsset.Create(Guid.NewGuid(), "logo", "image/png", 512, 512, 100, DateTimeOffset.UtcNow);
        Assert.False(asset.IsActive);
        Assert.False(asset.IsReady);
        Assert.Throws<InvalidOperationException>(() => asset.Activate());
        asset.MarkReady();
        asset.Activate();
        Assert.True(asset.IsActive);
        Assert.Null(asset.ExpiresAt);
    }

    [Fact]
    public void RetiredAssetsRemainPrivateUntilTheirRetentionDeadline()
    {
        var now = DateTimeOffset.UtcNow;
        var asset = MediaAsset.Create(Guid.NewGuid(), "banner", "image/webp", 1600, 900, 100, now);
        Assert.Equal(now.AddHours(24), asset.ExpiresAt);
        asset.MarkReady();
        asset.Activate();
        asset.Retire(now);
        Assert.False(asset.IsActive);
        Assert.Equal(now.AddDays(7), asset.ExpiresAt);
        Assert.StartsWith($"tenants/{asset.TenantId:N}/media/", asset.ObjectKey);
    }

    [Theory]
    [InlineData("../logo")]
    [InlineData("photo")]
    public void UnsupportedSlotsAreRejected(string slot) =>
        Assert.Throws<ArgumentException>(() => MediaAsset.Create(Guid.NewGuid(), slot, "image/png", 512, 512, 100, DateTimeOffset.UtcNow));
}
