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

        if (command.Items is null || command.Items.Count is < 1 or > 50)
            return Validation("items", "invalid_count", "An order must contain 1 to 50 items.");
        if (command.Items.Any(item => item is null || item.ProductId == Guid.Empty || item.OptionIds is null))
            return Validation("items", "invalid_value", "An order item is invalid.");
        if (command.Items.GroupBy(item => item.ProductId).Any(group => group.Count() > 1))
            return Validation("items", "duplicate_product", "Product lines must be unique.");

        var normalizedCode = string.IsNullOrWhiteSpace(command.DiscountCode)
            ? null
            : command.DiscountCode.Trim().ToUpperInvariant();
        var catalog = await orders.GetCheckoutCatalogAsync(command.TenantId, locale.Locale, locale.DefaultLocale,
            command.Items.Select(item => item.ProductId).ToArray(), normalizedCode, cancellationToken);
        if (catalog.Products.Count != command.Items.Count)
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var products = catalog.Products.ToDictionary(product => product.Id);
        var snapshots = new List<OrderLineSnapshot>(command.Items.Count);
        foreach (var item in command.Items)
        {
            var product = products[item.ProductId];
            if (item.Quantity is < 1 or > 99)
                return Validation("items", "invalid_quantity", "Quantity must be between 1 and 99.");
            if (item.OptionIds!.Count > 20 || item.OptionIds.Distinct().Count() != item.OptionIds.Count)
                return Validation("items", "invalid_options", "Selected options are invalid.");

            var selectedOptions = product.OptionGroups.SelectMany(group => group.Options
                .Where(option => item.OptionIds.Contains(option.Id))
                .Select(option => (Group: group, Option: option))).ToArray();
            if (selectedOptions.Length != item.OptionIds.Count)
                return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.NotFound));

            foreach (var group in product.OptionGroups)
            {
                var selectedCount = selectedOptions.Count(selection => selection.Group.Id == group.Id);
                if (selectedCount < group.MinimumSelections || selectedCount > group.MaximumSelections)
                    return Validation("items", "invalid_option_selection", "Selected options do not meet the product requirements.");
            }

            snapshots.Add(new OrderLineSnapshot(product.Id, product.Name, product.BasePrice,
                product.TaxRatePercent, item.Quantity, selectedOptions.Select(selection =>
                    new OrderOptionSnapshot(selection.Option.Id, selection.Option.Name,
                        selection.Option.PriceAdjustment)).ToArray())
            {
                ContainsAllergens = product.ContainsAllergens,
                MayContainAllergens = product.MayContainAllergens,
                DietaryTags = product.DietaryTags,
                PreparationMinutes = product.PreparationMinutes,
                PreparationNotes = product.PreparationNotes
            });
        }

        if (normalizedCode is not null && catalog.Discount is null)
            return Validation("discountCode", "invalid_discount", "The discount code is not valid for this restaurant.");

        try
        {
            var subtotal = snapshots.Sum(line =>
                (line.BaseUnitPrice + line.Options.Sum(option => option.PriceAdjustment)) * line.Quantity);
            if (catalog.Discount is { } eligibleDiscount)
            {
                DateOnly restaurantDate;
                try
                {
                    var timeZone = TimeZoneInfo.FindSystemTimeZoneById(catalog.TimeZone);
                    restaurantDate = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(now, timeZone).DateTime);
                }
                catch (TimeZoneNotFoundException)
                {
                    return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.NotFound));
                }
                catch (InvalidTimeZoneException)
                {
                    return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.NotFound));
                }

                if (eligibleDiscount.ExpiresOn is { } expiresOn && restaurantDate > expiresOn)
                    return Validation("discountCode", "discount_expired", "This discount code has expired.");
                if (subtotal < eligibleDiscount.MinimumOrderAmount)
                    return Validation("discountCode", "discount_minimum_not_met",
                        "The order subtotal does not meet this discount's minimum order amount.");
            }
            var discountAmount = catalog.Discount switch
            {
                { Kind: DiscountKind.FixedAmount } discount => Math.Min(subtotal, discount.Value),
                { Kind: DiscountKind.Percentage } discount =>
                    decimal.Round(subtotal * discount.Value / 100m, 2, MidpointRounding.AwayFromZero),
                _ => 0m
            };
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
                analyticsFingerprintKeys, analyticsPriorOrderIds);
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
