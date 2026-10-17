using System.Text.Json;
using System.Text.RegularExpressions;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed record OrderEmailTemplateDto(string Subject, string Heading, string Body);
public sealed record OrderEmailLocaleTemplatesDto(string Locale, OrderEmailTemplateDto OrderCreated,
    OrderEmailTemplateDto Preparing, OrderEmailTemplateDto Ready);
public sealed record OrderEmailSettingsDto(int Version, string DefaultLocale, IReadOnlyList<string> Locales,
    IReadOnlyList<OrderEmailLocaleTemplatesDto> Templates, IReadOnlyList<OrderEmailLocaleTemplatesDto> Defaults);

public interface IOrderEmailSettingsRepository
{
    Task<Tenant?> GetAsync(Guid tenantId, CancellationToken ct);
    Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, CancellationToken ct);
}

public static class OrderEmailTemplateRules
{
    private static readonly HashSet<string> AllowedPlaceholders = new(StringComparer.Ordinal)
    {
        "customerName", "restaurantName", "orderNumber", "orderSummary", "pickupTime",
        "pickupInstructions", "trackingUrl"
    };

    public static bool IsValid(OrderEmailLocaleTemplatesDto template)
    {
        var values = new[] { template.OrderCreated, template.Preparing, template.Ready };
        return values.All(value => value is not null && IsValidText(value.Subject, 120, singleLine: true) &&
            IsValidText(value.Heading, 120, singleLine: true) && IsValidText(value.Body, 2000, singleLine: false));
    }

    public static OrderEmailTemplateDto Default(string? locale, string eventType)
    {
        var french = locale?.StartsWith("fr", StringComparison.OrdinalIgnoreCase) == true;
        return (eventType, french) switch
        {
            ("order.created", true) => new("Commande {{orderNumber}} reçue", "Merci, {{customerName}} !",
                "{{restaurantName}} a reçu votre commande.\n\n{{orderSummary}}\n\nRetrait : {{pickupTime}}\n{{pickupInstructions}}\n\nSuivre la commande : {{trackingUrl}}"),
            ("order.preparing", true) => new("La commande {{orderNumber}} est en préparation", "Votre commande est en préparation",
                "{{restaurantName}} prépare votre commande.\n\nRetrait : {{pickupTime}}\n{{pickupInstructions}}\n\nSuivre la commande : {{trackingUrl}}"),
            ("order.ready", true) => new("La commande {{orderNumber}} est prête", "Votre commande est prête à être retirée",
                "Présentez-vous chez {{restaurantName}} pour récupérer votre commande.\n\n{{pickupInstructions}}\n\nSuivre la commande : {{trackingUrl}}"),
            ("order.created", _) => new("Order {{orderNumber}} received", "Thanks, {{customerName}}!",
                "{{restaurantName}} has received your order.\n\n{{orderSummary}}\n\nPickup: {{pickupTime}}\n{{pickupInstructions}}\n\nTrack your order: {{trackingUrl}}"),
            ("order.preparing", _) => new("Order {{orderNumber}} is being prepared", "Your order is being prepared",
                "{{restaurantName}} is preparing your order.\n\nPickup: {{pickupTime}}\n{{pickupInstructions}}\n\nTrack your order: {{trackingUrl}}"),
            _ => new("Order {{orderNumber}} is ready", "Your order is ready for pickup",
                "Please collect your order from {{restaurantName}}.\n\n{{pickupInstructions}}\n\nTrack your order: {{trackingUrl}}")
        };
    }

    private static bool IsValidText(string? value, int maxLength, bool singleLine)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > maxLength || value.Contains('<') || value.Contains('>') ||
            (singleLine && (value.Contains('\r') || value.Contains('\n')))) return false;
        var matches = Regex.Matches(value, "\\{\\{\\s*([^}]+?)\\s*\\}\\}");
        if (matches.Cast<Match>().Any(match => !AllowedPlaceholders.Contains(match.Groups[1].Value))) return false;
        var withoutMatches = Regex.Replace(value, "\\{\\{\\s*[^}]+?\\s*\\}\\}", string.Empty);
        return !withoutMatches.Contains("{{", StringComparison.Ordinal) &&
               !withoutMatches.Contains("}}", StringComparison.Ordinal);
    }
}

public sealed class OrderEmailSettingsHandler(IStaffMembershipRepository memberships,
    IOrderEmailSettingsRepository repository)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<Result<OrderEmailSettingsDto>> GetAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, ct)) return Missing();
        var tenant = await repository.GetAsync(tenantId, ct);
        return tenant is null ? Missing() : Result<OrderEmailSettingsDto>.Success(ToDto(tenant));
    }

    public async Task<Result<OrderEmailSettingsDto>> SaveAsync(Guid tenantId, ExternalIdentity identity,
        IReadOnlyList<OrderEmailLocaleTemplatesDto>? templates, int? expectedVersion, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, ct)) return Missing();
        var tenant = await repository.GetAsync(tenantId, ct);
        if (tenant is null) return Missing();
        if (expectedVersion is null) return Fail(ErrorCode.PreconditionRequired);
        if (tenant.OrderEmailTemplatesVersion != expectedVersion) return Fail(ErrorCode.PreconditionFailed);
        if (!AreValid(tenant, templates)) return Validation();

        tenant.SetOrderEmailTemplates(JsonSerializer.Serialize(templates, JsonOptions));
        if (!await repository.SaveAsync(tenant, identity, expectedVersion.Value, ct))
            return await CatalogAccess.CanManageAsync(memberships, tenantId, identity, ct)
                ? Fail(ErrorCode.PreconditionFailed) : Missing();
        return Result<OrderEmailSettingsDto>.Success(ToDto(tenant));
    }

    public static OrderEmailTemplateDto ResolveTemplate(Tenant tenant, string? locale, string eventType)
    {
        var templates = Deserialize(tenant.OrderEmailTemplatesJson);
        var requestedLocale = tenant.SupportsMenuLocale(locale) ? locale! : tenant.DefaultMenuLocale;
        var requested = templates.FirstOrDefault(item => item.Locale.Equals(requestedLocale, StringComparison.OrdinalIgnoreCase));
        var fallback = templates.FirstOrDefault(item => item.Locale.Equals(tenant.DefaultMenuLocale, StringComparison.OrdinalIgnoreCase));
        var selected = eventType switch
        {
            "order.created" => requested?.OrderCreated ?? fallback?.OrderCreated,
            "order.preparing" => requested?.Preparing ?? fallback?.Preparing,
            "order.ready" => requested?.Ready ?? fallback?.Ready,
            _ => null
        };
        return selected ?? OrderEmailTemplateRules.Default(requestedLocale, eventType);
    }

    private static bool AreValid(Tenant tenant, IReadOnlyList<OrderEmailLocaleTemplatesDto>? templates)
    {
        if (templates is null || templates.Count != tenant.GetMenuLocales().Count) return false;
        var expected = tenant.GetMenuLocales().ToHashSet(StringComparer.OrdinalIgnoreCase);
        return templates.All(template => template is not null && expected.Remove(template.Locale) &&
            MenuLocale.TryCreate(template.Locale, out _) && OrderEmailTemplateRules.IsValid(template)) && expected.Count == 0;
    }

    private static OrderEmailSettingsDto ToDto(Tenant tenant)
    {
        var saved = Deserialize(tenant.OrderEmailTemplatesJson);
        var templates = tenant.GetMenuLocales().Select(locale => saved.FirstOrDefault(item =>
                item.Locale.Equals(locale, StringComparison.OrdinalIgnoreCase)) ?? Defaults(locale))
            .ToArray();
        var defaults = tenant.GetMenuLocales().Select(Defaults).ToArray();
        return new(tenant.OrderEmailTemplatesVersion, tenant.DefaultMenuLocale, tenant.GetMenuLocales(), templates, defaults);
    }

    private static OrderEmailLocaleTemplatesDto Defaults(string locale) => new(locale,
        OrderEmailTemplateRules.Default(locale, "order.created"),
        OrderEmailTemplateRules.Default(locale, "order.preparing"),
        OrderEmailTemplateRules.Default(locale, "order.ready"));

    private static IReadOnlyList<OrderEmailLocaleTemplatesDto> Deserialize(string json)
    {
        try { return JsonSerializer.Deserialize<OrderEmailLocaleTemplatesDto[]>(json, JsonOptions) ?? []; }
        catch (JsonException) { return []; }
    }

    private static Result<OrderEmailSettingsDto> Missing() => Fail(ErrorCode.NotFound);
    private static Result<OrderEmailSettingsDto> Fail(ErrorCode code) =>
        Result<OrderEmailSettingsDto>.Failure(new ApplicationError(code));
    private static Result<OrderEmailSettingsDto> Validation() => Result<OrderEmailSettingsDto>.Failure(
        new ApplicationError(ErrorCode.ValidationFailed, new ValidationIssue("templates", "invalid_email_templates",
            "Email templates must include each enabled language and event, use plain text, and contain only supported placeholders.")));
}
