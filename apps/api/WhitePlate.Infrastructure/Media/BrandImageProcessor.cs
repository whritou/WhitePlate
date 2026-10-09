using ImageMagick;
using WhitePlate.Application.Media;
using WhitePlate.Domain.Media;

namespace WhitePlate.Infrastructure.Media;

public sealed class BrandImageProcessor : IMediaImageProcessor
{
    private static readonly SemaphoreSlim Gate = new(2);
    static BrandImageProcessor()
    {
        ResourceLimits.Memory = 128UL * 1024 * 1024;
        ResourceLimits.Disk = 0;
        ResourceLimits.Thread = 1;
        ResourceLimits.Time = 15;
        ResourceLimits.Width = 4096;
        ResourceLimits.Height = 4096;
    }

    public async Task<NormalizedImage> NormalizeAsync(string slot, string aspect, byte[] bytes, CancellationToken ct)
    {
        var limit = slot switch { "logo" => 2, "favicon" => 1, "banner" => 4, _ => 0 };
        if (!MediaAsset.IsSlot(slot) || bytes.Length == 0 || bytes.Length > limit * 1024 * 1024 ||
            (slot == "banner" && aspect is not ("16:9" or "21:9"))) throw new InvalidMediaException();
        var format = Detect(bytes);
        RejectAnimation(bytes, format);
        if (slot == "favicon" ? format is not (MagickFormat.Png or MagickFormat.Ico) :
            format is not (MagickFormat.Png or MagickFormat.Jpeg or MagickFormat.WebP)) throw new InvalidMediaException();
        await Gate.WaitAsync(ct);
        try
        {
            return Normalize(slot, aspect, bytes, format);
        }
        catch (MagickException) { throw new InvalidMediaException(); }
        finally { Gate.Release(); }
    }

    private static NormalizedImage Normalize(string slot, string aspect, byte[] bytes, MagickFormat format)
    {
        // Pin the decoder from an allowlisted signature. Never let content select SVG/URL/delegates.
        var settings = new MagickReadSettings { Format = format };
        using var frames = new MagickImageCollection();
        frames.Ping(bytes, settings);
        if (frames.Count == 0 || frames.Count > (format == MagickFormat.Ico ? 32 : 1)) throw new InvalidMediaException();
        if (frames.Any(frame => frame.Width > 4096 || frame.Height > 4096 || (ulong)frame.Width * frame.Height > 16_000_000))
            throw new InvalidMediaException();
        settings.FrameIndex = format == MagickFormat.Ico ? (uint)frames.Select((frame, index) => (frame, index))
            .OrderByDescending(item => (ulong)item.frame.Width * item.frame.Height).First().index : 0;
        settings.FrameCount = 1;
        using var image = new MagickImage(bytes, settings);
        image.AutoOrient();
        var minimumWidth = slot switch { "logo" => 512U, "banner" => 640U, _ => 64U };
        var minimumHeight = slot switch { "logo" => 512U, "banner" => 360U, _ => 64U };
        if (image.Width < minimumWidth || image.Height < minimumHeight) throw new InvalidMediaException();
        image.Strip();
        image.ColorSpace = ColorSpace.sRGB;
        var width = slot == "banner" ? (aspect == "21:9" ? 1680U : 1600U) : (slot == "logo" ? 512U : 64U);
        var height = slot == "banner" ? (aspect == "21:9" ? 720U : 900U) : width;
        image.Resize(new MagickGeometry(width, height) { FillArea = slot == "banner" });
        image.BackgroundColor = MagickColors.Transparent;
        image.Extent(width, height, Gravity.Center);
        image.Quality = 85;
        var outputFormat = slot == "banner" ? MagickFormat.WebP : MagickFormat.Png;
        return new(image.ToByteArray(outputFormat), slot == "banner" ? "image/webp" : "image/png", (int)width, (int)height);
    }

    private static MagickFormat Detect(byte[] bytes)
    {
        if (bytes.AsSpan().StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return MagickFormat.Png;
        if (bytes.AsSpan().StartsWith(new byte[] { 255, 216, 255 })) return MagickFormat.Jpeg;
        if (bytes.AsSpan().StartsWith(new byte[] { 0, 0, 1, 0 })) return MagickFormat.Ico;
        if (bytes.Length >= 12 && bytes.AsSpan(0, 4).SequenceEqual("RIFF"u8) && bytes.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return MagickFormat.WebP;
        throw new InvalidMediaException();
    }

    private static void RejectAnimation(byte[] bytes, MagickFormat format)
    {
        if (format is not (MagickFormat.Png or MagickFormat.WebP)) return;
        var png = format == MagickFormat.Png;
        var offset = png ? 8 : 12;
        while (offset + (png ? 12 : 8) <= bytes.Length)
        {
            var type = bytes.AsSpan(offset + (png ? 4 : 0), 4);
            var length = png ? System.Buffers.Binary.BinaryPrimitives.ReadUInt32BigEndian(bytes.AsSpan(offset, 4)) :
                System.Buffers.Binary.BinaryPrimitives.ReadUInt32LittleEndian(bytes.AsSpan(offset + 4, 4));
            if ((long)offset + length + (png ? 12 : 8) > bytes.Length) throw new InvalidMediaException();
            if (type.SequenceEqual("acTL"u8) || type.SequenceEqual("ANIM"u8) || type.SequenceEqual("ANMF"u8)) throw new InvalidMediaException();
            offset += checked((int)length + (png ? 12 : 8) + (!png && length % 2 != 0 ? 1 : 0));
        }
    }
}
