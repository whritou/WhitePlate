using ImageMagick;
using WhitePlate.Application.Media;
using WhitePlate.Infrastructure.Media;

namespace WhitePlate.Tests.Infrastructure;

public sealed class BrandImageProcessorTests
{
    [Fact]
    public async Task LogoIsNormalizedToTransparentSquareWithoutCropping()
    {
        using var source = new MagickImage(MagickColors.Red, 1024, 512);
        var result = await new BrandImageProcessor().NormalizeAsync("logo", "16:9", source.ToByteArray(MagickFormat.Png), TestContext.Current.CancellationToken);
        Assert.Equal(512, result.Width);
        Assert.Equal(512, result.Height);
        using var normalized = new MagickImage(result.Bytes);
        Assert.True(normalized.HasAlpha);
        Assert.Equal(MagickFormat.Png, normalized.Format);
    }

    [Theory]
    [InlineData("<svg xmlns='http://www.w3.org/2000/svg'/>")]
    [InlineData("not an image")]
    public async Task ActiveContentAndMalformedInputAreRejected(string input) =>
        await Assert.ThrowsAsync<InvalidMediaException>(() => new BrandImageProcessor().NormalizeAsync("logo", "16:9",
            System.Text.Encoding.UTF8.GetBytes(input), TestContext.Current.CancellationToken));

    [Fact]
    public async Task OversizedDimensionsAndTooSmallLogoAreRejected()
    {
        using var small = new MagickImage(MagickColors.Red, 64, 64);
        var oversized = small.ToByteArray(MagickFormat.Png);
        System.Buffers.Binary.BinaryPrimitives.WriteUInt32BigEndian(oversized.AsSpan(16, 4), 4097);
        var processor = new BrandImageProcessor();
        foreach (var bytes in new[] { oversized, small.ToByteArray(MagickFormat.Png), new byte[2 * 1024 * 1024 + 1] })
            await Assert.ThrowsAsync<InvalidMediaException>(() => processor.NormalizeAsync("logo", "16:9", bytes, TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task BannerUsesSelectedAspectAndFaviconAcceptsRealIco()
    {
        using var source = new MagickImage(MagickColors.Blue, 800, 600);
        var processor = new BrandImageProcessor();
        var banner = await processor.NormalizeAsync("banner", "21:9", source.ToByteArray(MagickFormat.Jpeg), TestContext.Current.CancellationToken);
        Assert.Equal((1680, 720, "image/webp"), (banner.Width, banner.Height, banner.ContentType));
        source.Resize(new MagickGeometry(64, 64) { IgnoreAspectRatio = true });
        var favicon = await processor.NormalizeAsync("favicon", "16:9", source.ToByteArray(MagickFormat.Ico), TestContext.Current.CancellationToken);
        Assert.Equal((64, 64, "image/png"), (favicon.Width, favicon.Height, favicon.ContentType));
    }

    [Fact]
    public async Task AnimatedPngIsRejectedEvenWhenItsFirstFrameIsAValidLogo()
    {
        using var source = new MagickImage(MagickColors.Red, 512, 512);
        var png = source.ToByteArray(MagickFormat.Png);
        // Insert an APNG animation-control chunk after IHDR. Detection must precede first-frame decoding.
        var animation = new byte[20];
        System.Buffers.Binary.BinaryPrimitives.WriteInt32BigEndian(animation.AsSpan(0, 4), 8);
        "acTL"u8.CopyTo(animation.AsSpan(4));
        System.Buffers.Binary.BinaryPrimitives.WriteInt32BigEndian(animation.AsSpan(8, 4), 2);
        var input = png[..33].Concat(animation).Concat(png[33..]).ToArray();
        await Assert.ThrowsAsync<InvalidMediaException>(() => new BrandImageProcessor().NormalizeAsync("logo", "16:9", input, TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task MultiSizeIcoUsesLargestFrameInsteadOfRejectingTheSmallFirstFrame()
    {
        using var frames = new MagickImageCollection();
        frames.Add(new MagickImage(MagickColors.Red, 16, 16));
        frames.Add(new MagickImage(MagickColors.Blue, 64, 64));
        var result = await new BrandImageProcessor().NormalizeAsync("favicon", "16:9", frames.ToByteArray(MagickFormat.Ico), TestContext.Current.CancellationToken);
        Assert.Equal((64, 64), (result.Width, result.Height));
    }
}
