using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed class CreateOrderCommandHandler(IOrderRepository orders, TimeProvider timeProvider,
    IEmailTrackingCapability trackingCapability, IAnalyticsRepository? analytics = null,
    IAnalyticsPrivacyService? analyticsPrivacy = null)
{
    private static readonly JsonSerializerOptions FingerprintJson = new(JsonSerializerDefaults.Web);

    public async Task<Result<OrderReceiptDto>> HandleAsync(CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();

        if (!IsValidIdempotencyKey(command.IdempotencyKey))
            return Validation("Idempotency-Key", "required", "A valid Idempotency-Key header is required.");
        var hasEmail = !string.IsNullOrWhiteSpace(command.CustomerEmail);
        if (command.EmailUpdatesConsented && !hasEmail || command.AnalyticsConsented && !hasEmail ||
            !command.EmailUpdatesConsented && !command.AnalyticsConsented && hasEmail)
            return Validation("emailUpdatesConsent", "consent_required",
                "Provide an email address only when opting in to analytics or order updates.");
        if (command.AnalyticsSource is not ("web" or "qr"))
            return Validation("analyticsSource", "invalid_value", "The analytics source is invalid.");

        string? trackingTokenHash = null;
        if (command.TrackingToken is not null && !OrderTrackingToken.TryHash(command.TrackingToken, out trackingTokenHash))
            return Validation("trackingToken", "invalid_value", "The order tracking token is invalid.");

        var key = command.IdempotencyKey!.Trim();
        var locale = await orders.ResolveCheckoutLocaleAsync(command.TenantId, command.MenuLocale,
            cancellationToken);
        if (locale is null) return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var now = timeProvider.GetUtcNow();
        IReadOnlyList<AnalyticsFingerprint>? analyticsFingerprints = null;
        IReadOnlyList<(string KeyVersion, string Hash)> analyticsFingerprintKeys = [];
        if (command.AnalyticsConsented)
        {
            if (analytics is null || analyticsPrivacy is null)
                return Validation("analyticsConsent", "privacy_key_unavailable",
                    "Analytics consent is temporarily unavailable. You can place the order without selecting analytics consent.");
            var lookup = analyticsPrivacy.CreateLookup(command.TenantId, command.CustomerEmail);
            if (lookup.Status == AnalyticsFingerprintLookupStatus.InvalidEmail)
                return Validation("customerEmail", "invalid_value", "Provide a valid email address for analytics consent.");
            if (lookup.Status != AnalyticsFingerprintLookupStatus.Available || lookup.CurrentKeyVersion is null ||
                lookup.Hashes.Count == 0)
                return Validation("analyticsConsent", "privacy_key_unavailable",
                    "Analytics consent is temporarily unavailable. You can place the order without selecting analytics consent.");
            var currentFingerprint = lookup.Hashes.SingleOrDefault(item => item.KeyVersion == lookup.CurrentKeyVersion);
            if (currentFingerprint == default)
                return Validation("analyticsConsent", "privacy_key_unavailable",
                    "Analytics consent is temporarily unavailable. You can place the order without selecting analytics consent.");
            analyticsFingerprintKeys = lookup.Hashes;
            analyticsFingerprints = [new AnalyticsFingerprint(currentFingerprint.KeyVersion, currentFingerprint.Hash,
                now.AddDays(365))];
        }
        IReadOnlyList<Guid> analyticsPriorOrderIds = command.AnalyticsConsented
            ? await analytics!.GetPriorConsentedOrderIdsAsync(command.TenantId, analyticsFingerprintKeys, now,
                now.AddDays(-365), cancellationToken)
            : Array.Empty<Guid>();
        var returningCustomer = analyticsPriorOrderIds.Count > 0;
        var keyHash = Hash(key);
        var requestHash = Hash(CreateFingerprint(command, locale.Locale, trackingTokenHash,
            analyticsFingerprints));
        var existing = await orders.FindIdempotentOrderAsync(command.TenantId, keyHash, requestHash, now,
            cancellationToken);
        if (existing.Outcome == IdempotencyOutcome.Replayed)
            return Result<OrderReceiptDto>.Success(existing.Receipt!);
        if (existing.Outcome == IdempotencyOutcome.Conflict)
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.Conflict));

        var availability = await orders.GetPickupSlotsAsync(command.TenantId, now, cancellationToken);
        if (availability.State == "schedule_not_configured")
            return Validation("pickupAt", "schedule_unavailable", "Pickup scheduling is unavailable until opening hours are configured.");
        var selectedSlot = command.PickupAt is null ? availability.Slots.FirstOrDefault() : availability.Slots.FirstOrDefault(slot =>
            slot.RemainingCapacity > 0 &&
            slot.StartsAt.UtcDateTime.Ticks == command.PickupAt.Value.UtcDateTime.Ticks);
        if (selectedSlot is null)
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.Conflict));

        var pricing = await CheckoutPricingReader.ReadAsync(orders, command.TenantId, locale, command.Items,
            command.DiscountCode, now, cancellationToken);
        if (!pricing.IsSuccess) return Result<OrderReceiptDto>.Failure(pricing.Error);
        var (catalog, normalizedCode, snapshots, discountAmount) = pricing.Value;
        try
        {
            var orderId = Guid.NewGuid();
            var emailExpiry = DateTimeOffset.FromUnixTimeSeconds(now.AddDays(30).ToUnixTimeSeconds());
            var emailTrackingCapability = command.EmailUpdatesConsented
                ? trackingCapability.Create(command.TenantId, orderId, emailExpiry)
                : null;
            var order = Order.Create(command.TenantId, catalog.Currency, command.CustomerName, snapshots,
                normalizedCode, discountAmount, now, catalog.Locale, trackingTokenHash,
                trackingTokenHash is null && emailTrackingCapability is null ? null : emailExpiry,
                selectedSlot.StartsAt, selectedSlot.TimeZone,
                command.PickupAt is null ? PickupMode.Asap : PickupMode.Scheduled,
                command.EmailUpdatesConsented ? command.CustomerEmail : null,
                command.EmailUpdatesConsented ? now : null, emailTrackingCapability?.TokenHash, orderId,
                command.AnalyticsSource, command.AnalyticsConsented ? now : null, returningCustomer,
                analyticsFingerprintKeys, analyticsPriorOrderIds, command.CustomerPhone, command.OrderNotes);
            var receipt = order.ToReceipt();
            var result = await orders.CreateOrderAsync(order, receipt, keyHash, requestHash, now,
                cancellationToken);
            return result.Outcome switch
            {
                IdempotencyOutcome.New or IdempotencyOutcome.Replayed => Result<OrderReceiptDto>.Success(result.Receipt!),
                IdempotencyOutcome.Conflict => Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.Conflict)),
                _ => throw new InvalidOperationException("Unsupported idempotency result.")
            };
        }
        catch (DomainRuleException exception)
        {
            return Validation(exception.Field, exception.Code, exception.Message);
        }
    }

    private static bool IsValidIdempotencyKey(string? value) =>
        !string.IsNullOrWhiteSpace(value) && value.Trim().Length <= 128 &&
        value.Trim().All(character => character is >= '!' and <= '~');

    private static string CreateFingerprint(CreateOrderCommand command, string effectiveLocale,
        string? trackingTokenHash, IReadOnlyList<AnalyticsFingerprint>? analyticsFingerprints)
    {
        var canonical = new
        {
            customerName = command.CustomerName?.Trim(),
            customerPhone = string.IsNullOrWhiteSpace(command.CustomerPhone) ? null : command.CustomerPhone.Trim(),
            orderNotes = string.IsNullOrWhiteSpace(command.OrderNotes) ? null : command.OrderNotes.Trim(),
            customerEmail = command.EmailUpdatesConsented ? command.CustomerEmail?.Trim().ToLowerInvariant() : null,
            emailUpdatesConsented = command.EmailUpdatesConsented,
            analyticsConsented = command.AnalyticsConsented,
            analyticsSource = command.AnalyticsConsented ? command.AnalyticsSource : null,
            analyticsFingerprints = analyticsFingerprints?.Select(item => new { item.KeyVersion, item.Hash }),
            menuLocale = effectiveLocale,
            trackingTokenHash,
            pickupAt = command.PickupAt?.UtcDateTime,
            discountCode = string.IsNullOrWhiteSpace(command.DiscountCode)
                ? null
                : command.DiscountCode.Trim().ToUpperInvariant(),
            items = command.Items?.Select(item => new
            {
                productId = item.ProductId,
                quantity = item.Quantity,
                optionIds = item.OptionIds?.Order().ToArray()
            }).ToArray()
        };
        return JsonSerializer.Serialize(canonical, FingerprintJson);
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)))
        .ToLowerInvariant();

    private static Result<OrderReceiptDto> Validation(string field, string code, string message) =>
        Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
            new ValidationIssue(field, code, message)));
}
