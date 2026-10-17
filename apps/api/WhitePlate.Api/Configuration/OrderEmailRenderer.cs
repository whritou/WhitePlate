using System.Globalization;
using System.Text.Encodings.Web;
using System.Text.RegularExpressions;
using WhitePlate.Application.Orders;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Orders;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Api.Configuration;

public sealed record RenderedOrderEmail(string Subject, string Html, string Text, string? TrackingToken);

public static partial class OrderEmailRenderer
{
    private static readonly Regex Placeholder = new("\\{\\{\\s*([A-Za-z]+)\\s*\\}\\}", RegexOptions.Compiled);

    public static RenderedOrderEmail Render(Order order, Tenant tenant, OrderEmailDelivery delivery,
        IEmailTrackingCapability trackingCapability, IConfiguration configuration)
    {
        var locale = order.MenuLocale ?? tenant.DefaultMenuLocale;
        var template = OrderEmailSettingsHandler.ResolveTemplate(tenant, locale, delivery.EventType);
        var culture = ResolveCulture(locale);
        var theme = tenant.GetPublishedTheme().Appearance;
        var primary = IsHex(theme.Primary) ? theme.Primary : "#1f7a4d";
        var capability = ResolveTrackingCapability(order, tenant, trackingCapability);
        var storefrontUrl = ResolveStorefrontUrl(configuration, tenant);
        var trackingUrl = capability is null || storefrontUrl is null
            ? "—"
            : new Uri(new Uri(storefrontUrl), $"{ResolveRouteLocale(locale)}/order/{order.Id:D}#{capability.Token}").AbsoluteUri;
        var pickupInstructions = tenant.ResolvePickupInstructions(locale).Text ?? string.Empty;
        var values = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["customerName"] = order.CustomerName,
            ["restaurantName"] = tenant.Name,
            ["orderNumber"] = order.Id.ToString("N")[..8].ToUpperInvariant(),
            ["orderSummary"] = FormatOrderSummary(order, culture),
            ["pickupTime"] = FormatPickupTime(order, culture),
            ["pickupInstructions"] = pickupInstructions,
            ["trackingUrl"] = trackingUrl
        };
        var subject = Substitute(template.Subject, values, html: false, trackingLinkLabel: "", linkColor: primary);
        var heading = Substitute(template.Heading, values, html: true, trackingLinkLabel: "", linkColor: primary);
        var body = Substitute(template.Body, values, html: true,
            trackingLinkLabel: locale.StartsWith("fr", StringComparison.OrdinalIgnoreCase)
                ? "Suivre la commande" : "Track order", linkColor: primary);
        var textHeading = Substitute(template.Heading, values, html: false, trackingLinkLabel: "", linkColor: primary);
        var text = $"{textHeading}\n\n{Substitute(template.Body, values, html: false, trackingLinkLabel: "", linkColor: primary)}";
        var html = BuildHtml(tenant, locale, storefrontUrl, heading, body);
        return new RenderedOrderEmail(subject, html, text, capability?.Token);
    }

    public static RenderedOrderEmail RestoreSnapshot(Order order, Tenant tenant, OrderEmailDelivery delivery,
        IEmailTrackingCapability trackingCapability)
    {
        if (delivery.SubjectSnapshot is null || delivery.HtmlSnapshot is null || delivery.TextSnapshot is null)
            throw new InvalidOperationException("The order email snapshot is incomplete.");
        var capability = ResolveTrackingCapability(order, tenant, trackingCapability);
        var containsCapability = delivery.HtmlSnapshot.Contains(TrackingTokenPlaceholder, StringComparison.Ordinal) ||
                                 delivery.TextSnapshot.Contains(TrackingTokenPlaceholder, StringComparison.Ordinal);
        if (containsCapability && capability is null)
            throw new InvalidOperationException("The order email tracking signing key does not match the stored capability.");
        var token = capability?.Token;
        return new RenderedOrderEmail(delivery.SubjectSnapshot,
            ReplaceTrackingToken(delivery.HtmlSnapshot, token), ReplaceTrackingToken(delivery.TextSnapshot, token), token);
    }

    public const string TrackingTokenPlaceholder = "__WHITEPLATE_ORDER_EMAIL_TRACKING_TOKEN__";

    public static string HideTrackingToken(string content, string? token) => token is null
        ? content
        : content.Replace(token, TrackingTokenPlaceholder, StringComparison.Ordinal);

    private static string ReplaceTrackingToken(string content, string? token) =>
        content.Replace(TrackingTokenPlaceholder, token ?? "—", StringComparison.Ordinal);

    private static EmailTrackingCapability? ResolveTrackingCapability(Order order, Tenant tenant,
        IEmailTrackingCapability trackingCapability)
    {
        if (order.EmailTrackingTokenHash is null) return null;
        var expiry = order.TrackingTokenExpiresAt ?? order.CreatedAt.AddDays(30);
        var capability = trackingCapability.Create(tenant.Id, order.Id, expiry);
        return capability is not null && string.Equals(capability.TokenHash, order.EmailTrackingTokenHash,
            StringComparison.Ordinal) ? capability : null;
    }

    private static string? ResolveStorefrontUrl(IConfiguration configuration, Tenant tenant)
    {
        var template = configuration["OrderEmails:StorefrontUrlTemplate"];
        if (string.IsNullOrWhiteSpace(template) || !template.Contains("{subdomain}", StringComparison.Ordinal)) return null;
        var value = template.Replace("{subdomain}", Uri.EscapeDataString(tenant.Subdomain.Value), StringComparison.Ordinal);
        return Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps &&
               string.IsNullOrEmpty(uri.UserInfo) ? uri.GetLeftPart(UriPartial.Authority) + "/" : null;
    }

    private static CultureInfo ResolveCulture(string locale)
    {
        try { return CultureInfo.GetCultureInfo(locale); }
        catch (CultureNotFoundException) { return CultureInfo.GetCultureInfo("en"); }
    }

    private static string ResolveRouteLocale(string locale) =>
        locale.StartsWith("fr", StringComparison.OrdinalIgnoreCase) ? "fr" : "en";

    private static string FormatOrderSummary(Order order, CultureInfo culture)
    {
        var currency = new Dictionary<string, string> { ["EUR"] = "EUR", ["USD"] = "USD", ["GBP"] = "GBP" }
            .GetValueOrDefault(order.Currency, "EUR");
        var price = new System.Globalization.CultureInfo(culture.Name);
        return string.Join("\n", order.Lines.Select(line =>
        {
            var options = line.Options.Count == 0 ? string.Empty : $" ({string.Join(", ", line.Options.Select(item => item.Name))})";
            var amount = line.Total.ToString("N2", price) + $" {currency}";
            return $"{line.Quantity} × {line.ProductName}{options} — {amount}";
        }));
    }

    private static string FormatPickupTime(Order order, CultureInfo culture)
    {
        if (order.PickupAt is null) return "—";
        var value = order.PickupAt.Value;
        if (!string.IsNullOrWhiteSpace(order.PickupTimeZone))
        {
            try { value = TimeZoneInfo.ConvertTime(value, TimeZoneInfo.FindSystemTimeZoneById(order.PickupTimeZone)); }
            catch (TimeZoneNotFoundException) { }
            catch (InvalidTimeZoneException) { }
        }
        return value.ToString("f zzz", culture);
    }

    private static string Substitute(string template, IReadOnlyDictionary<string, string> values, bool html,
        string trackingLinkLabel, string linkColor) => Placeholder.Replace(template, match =>
    {
        if (!values.TryGetValue(match.Groups[1].Value, out var value)) return match.Value;
        if (html && match.Groups[1].Value == "trackingUrl" && value != "—")
        {
            var href = HtmlEncoder.Default.Encode(value);
            var label = HtmlEncoder.Default.Encode(trackingLinkLabel);
            return $"<a href=\"{href}\" style=\"color:{linkColor};font-weight:600\">{label}</a>";
        }
        return html ? HtmlEncoder.Default.Encode(value) : value;
    });

    private static string BuildHtml(Tenant tenant, string locale, string? storefrontUrl, string heading, string body)
    {
        var publication = tenant.GetPublishedTheme();
        var theme = publication.Appearance;
        var primary = IsHex(theme.Primary) ? theme.Primary : "#1f7a4d";
        var background = IsHex(theme.Bg) ? theme.Bg : "#f7f8f4";
        var text = IsHex(theme.Text) ? theme.Text : "#14201a";
        var headerText = ThemeAppearance.Contrast("#ffffff", primary) >= 4.5 ? "#ffffff" : "#111111";
        var name = HtmlEncoder.Default.Encode(tenant.Name);
        var banner = storefrontUrl is null || publication.BannerAssetId is null ? string.Empty :
            $"<tr><td style=\"padding:0\"><img src=\"{HtmlEncoder.Default.Encode(new Uri(new Uri(storefrontUrl), "api/public/brand-assets/banner").AbsoluteUri)}\" alt=\"\" width=\"600\" style=\"display:block;width:100%;max-width:600px;max-height:180px;object-fit:cover\"></td></tr>";
        var logo = storefrontUrl is null || publication.LogoAssetId is null ? string.Empty :
            $"<img src=\"{HtmlEncoder.Default.Encode(new Uri(new Uri(storefrontUrl), "api/public/brand-assets/logo").AbsoluteUri)}\" alt=\"{name}\" style=\"display:block;max-width:180px;max-height:64px;margin:0 auto 12px\">";
        return $"""
            <!doctype html>
            <html lang="{HtmlEncoder.Default.Encode(locale)}">
            <head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>
            <body style="margin:0;background:{background};color:{text};font-family:Arial,sans-serif">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{background};padding:24px 12px">
                <tr><td align="center">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden">
                    {banner}
                    <tr><td align="center" style="background:{primary};padding:24px;color:{headerText}">{logo}<strong style="font-size:20px">{name}</strong></td></tr>
                    <tr><td style="padding:28px 24px 12px"><h1 style="margin:0;font-size:24px;line-height:1.3">{heading}</h1></td></tr>
                    <tr><td style="padding:12px 24px 28px;font-size:16px;line-height:1.6;white-space:pre-line">{body}</td></tr>
                    <tr><td style="border-top:1px solid #e5e7eb;padding:16px 24px;color:#5b625e;font-size:12px;text-align:center">Sent by WhitePlate for {name}. Order updates only.</td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """;
    }

    private static bool IsHex(string value) => Regex.IsMatch(value, "^#[0-9a-fA-F]{6}$", RegexOptions.CultureInvariant);
}
