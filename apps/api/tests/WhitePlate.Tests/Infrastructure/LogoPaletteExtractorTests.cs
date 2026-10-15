using ImageMagick;
using WhitePlate.Infrastructure.Media;

namespace WhitePlate.Tests.Infrastructure;

public sealed class LogoPaletteExtractorTests
{
    [Fact]
    public async Task NeutralTransparentOrInvalidLogosReturnAManualPresetFallback()
    {
        var extractor = new LogoPaletteExtractor();
        foreach (var color in new[] { MagickColors.White, MagickColors.Black, MagickColors.Transparent })
        {
            using var image = new MagickImage(color, 32, 32);
            Assert.Null(await extractor.ExtractAsync(image.ToByteArray(MagickFormat.Png), TestContext.Current.CancellationToken));
        }
        Assert.Null(await extractor.ExtractAsync([1, 2, 3], TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task DominantLogoColorProducesDeterministicEditableRoles()
    {
        using var image = new MagickImage(MagickColors.Red, 32, 32);
        var extractor = new LogoPaletteExtractor();
        var first = await extractor.ExtractAsync(image.ToByteArray(MagickFormat.Png), TestContext.Current.CancellationToken);
        var second = await extractor.ExtractAsync(image.ToByteArray(MagickFormat.Png), TestContext.Current.CancellationToken);
        Assert.Equal(first, second);
        Assert.Equal("#f80808", first!.Primary);
    }
}
