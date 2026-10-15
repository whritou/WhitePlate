using ImageMagick;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Infrastructure.Media;

public sealed class LogoPaletteExtractor : ILogoPaletteExtractor
{
    private static readonly SemaphoreSlim Gate = new(2);

    public async Task<ThemePalette?> ExtractAsync(byte[] png, CancellationToken ct)
    {
        await Gate.WaitAsync(ct);
        try
        {
            // Only normalized, tenant-owned T1 PNGs reach this decoder.
            using var image = new MagickImage(png, new MagickReadSettings { Format = MagickFormat.Png });
            image.Resize(64, 64);
            using var pixels = image.GetPixels();
            var colors = new Dictionary<int, int>();
            for (var y = 0; y < image.Height; y++)
            for (var x = 0; x < image.Width; x++)
            {
                var color = pixels.GetPixel(x, y).ToColor();
                if (color is null || color.A < 128) continue;
                var key = ((color.R / 16 * 16 + 8) << 16) | ((color.G / 16 * 16 + 8) << 8) | (color.B / 16 * 16 + 8);
                colors[key] = colors.GetValueOrDefault(key) + 1;
            }
            var usable = colors.OrderByDescending(entry => entry.Value).ThenBy(entry => entry.Key)
                .Where(entry => {
                    var r = (entry.Key >> 16) & 255; var g = (entry.Key >> 8) & 255; var b = entry.Key & 255;
                    return Math.Max(r, Math.Max(g, b)) - Math.Min(r, Math.Min(g, b)) >= 24;
                }).Take(2).Select(entry => $"#{entry.Key:x6}").ToArray();
            return usable.Length == 0 ? null : new(usable[0], usable.Length > 1 ? usable[1] : "#c8f04a", "#f7f8f4", "#14201a");
        }
        catch (MagickException) { return null; }
        finally { Gate.Release(); }
    }
}
