using System.Globalization;
using System.Text.RegularExpressions;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public record ThemeAppearance
{
    public string Primary { get; init; } = "#1f7a4d";
    public string Accent { get; init; } = "#c8f04a";
    public string Bg { get; init; } = "#f7f8f4";
    public string Text { get; init; } = "#14201a";
    public string Font { get; init; } = "Space Grotesk";
    public string HeadingFont { get; init; } = "Space Grotesk";
    public int HeadingWeight { get; init; } = 700;
    public int BodyWeight { get; init; } = 400;
    public double TextScale { get; init; } = 1;
    public double LineHeight { get; init; } = 1.5;
    public int ButtonRadius { get; init; } = 12;
    public string ButtonStyle { get; init; } = "solid";
    public string Spacing { get; init; } = "comfortable";
    public string ImageRatio { get; init; } = "landscape";
    public int BannerHeight { get; init; } = 300;
    public string BannerAlign { get; init; } = "left";
    public int BannerOverlay { get; init; } = 65;
    public bool ShowRestaurantInfo { get; init; } = true;
    public int Radius { get; init; } = 12;
    public string Layout { get; init; } = "grid";
    public bool ShowBanner { get; init; } = true;
    public string Ambiance { get; init; } = "custom";

    private static readonly string[] Fonts = ["Space Grotesk", "DM Sans", "Outfit", "Manrope",
        "Plus Jakarta Sans", "Sora", "Work Sans", "Nunito Sans", "Lora", "Fraunces",
        "Playfair Display", "Archivo Black", "Inter"];

    public void Validate()
    {
        foreach (var (field, color) in new[] { ("primary", Primary), ("accent", Accent), ("bg", Bg), ("text", Text) })
            Require(color is not null && Regex.IsMatch(color, "^#[0-9a-fA-F]{6}$", RegexOptions.CultureInvariant), field);
        Require(Fonts.Contains(Font, StringComparer.Ordinal), "font");
        Require(Fonts.Contains(HeadingFont, StringComparer.Ordinal), "headingFont");
        Require(HeadingWeight is 400 or 500 or 600 or 700, "headingWeight");
        Require(BodyWeight is 400 or 500, "bodyWeight");
        Require(double.IsFinite(TextScale) && TextScale is >= 0.9 and <= 1.2, "textScale");
        Require(double.IsFinite(LineHeight) && LineHeight is >= 1.3 and <= 1.8, "lineHeight");
        Require(ButtonRadius is >= 0 and <= 28, "buttonRadius");
        Require(Radius is >= 0 and <= 24, "radius");
        Require(ButtonStyle is "solid" or "outline", "buttonStyle");
        Require(Spacing is "compact" or "comfortable" or "airy", "spacing");
        Require(ImageRatio is "square" or "landscape" or "wide", "imageRatio");
        Require(BannerHeight is >= 180 and <= 440, "bannerHeight");
        Require(BannerAlign is "left" or "center", "bannerAlign");
        Require(BannerOverlay is >= 20 and <= 85, "bannerOverlay");
        Require(Layout is "grid" or "list", "layout");
        Require(Ambiance is "custom" or "crisp-light" or "warm-cream" or "bistro-noir", "ambiance");
    }

    private static void Require(bool valid, string field)
    {
        if (!valid) throw new DomainRuleException("invalid_theme", field, "The theme value is not supported.");
    }

    public static double Contrast(string first, string second)
    {
        var a = Luminance(first);
        var b = Luminance(second);
        return (Math.Max(a, b) + 0.05) / (Math.Min(a, b) + 0.05);
    }

    private static double Luminance(string color)
    {
        double Channel(int offset)
        {
            var value = int.Parse(color.AsSpan(offset, 2), NumberStyles.HexNumber, CultureInfo.InvariantCulture) / 255d;
            return value <= 0.04045 ? value / 12.92 : Math.Pow((value + 0.055) / 1.055, 2.4);
        }
        return 0.2126 * Channel(1) + 0.7152 * Channel(3) + 0.0722 * Channel(5);
    }
}
