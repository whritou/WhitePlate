using ImageMagick;
using WhitePlate.Application.Media;

namespace WhitePlate.Infrastructure.Media;

public sealed class ProductImageProcessor(IMediaImageProcessor images) : IProductImageProcessor
{
    private static readonly SemaphoreSlim Gate = new(2);
    public async Task<IReadOnlyDictionary<int, NormalizedImage>> NormalizeAsync(string aspect, byte[] bytes, CancellationToken ct)
    {
        var original = await images.NormalizeAsync("product", aspect, bytes, ct);
        await Gate.WaitAsync(ct);
        try
        {
            var variants = new Dictionary<int, NormalizedImage> { [1200] = original };
            foreach (var size in new[] { 320, 640 })
            {
                using var image = new MagickImage(original.Bytes, MagickFormat.WebP);
                if (image.Width > size) image.Resize((uint)size, 0);
                image.Strip();
                image.Quality = 85;
                variants[size] = new(image.ToByteArray(MagickFormat.WebP), "image/webp", (int)image.Width, (int)image.Height);
            }
            return variants;
        }
        catch (MagickException) { throw new InvalidMediaException(); }
        finally { Gate.Release(); }
    }
}
