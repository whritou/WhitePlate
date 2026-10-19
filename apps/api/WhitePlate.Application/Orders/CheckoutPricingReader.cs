using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Orders;
namespace WhitePlate.Application.Orders;

internal sealed record CheckoutPricing(CheckoutCatalogDto Catalog, string? Code, IReadOnlyList<OrderLineSnapshot> Lines, decimal Discount);
internal static class CheckoutPricingReader
{
    public static async Task<Result<CheckoutPricing>> ReadAsync(IOrderRepository orders, Guid tenantId, CheckoutLocaleDto locale, IReadOnlyList<CreateOrderItem>? items, string? discountCode, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (items is null || items.Count is < 1 or > 50)
            return Validation("items", "invalid_count", "An order must contain 1 to 50 items.");
        if (items.Any(item => item is null || item.ProductId == Guid.Empty || item.OptionIds is null))
            return Validation("items", "invalid_value", "An order item is invalid.");
        if (items.GroupBy(item => (item.ProductId, Options: string.Join(',', item.OptionIds!.Order())))
            .Any(group => group.Count() > 1))
            return Validation("items", "duplicate_variant", "Product and option combinations must be unique.");

        var normalizedCode = string.IsNullOrWhiteSpace(discountCode)
            ? null
            : discountCode.Trim().ToUpperInvariant();
        var catalog = await orders.GetCheckoutCatalogAsync(tenantId, locale.Locale, locale.DefaultLocale,
            items.Select(item => item.ProductId).Distinct().ToArray(), normalizedCode, cancellationToken);
        if (catalog.Products.Count != items.Select(item => item.ProductId).Distinct().Count())
            return Result<CheckoutPricing>.Failure(new ApplicationError(ErrorCode.NotFound));

        var products = catalog.Products.ToDictionary(product => product.Id);
        var snapshots = new List<OrderLineSnapshot>(items.Count);
        foreach (var item in items)
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
                return Result<CheckoutPricing>.Failure(new ApplicationError(ErrorCode.NotFound));

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
                return Result<CheckoutPricing>.Failure(new ApplicationError(ErrorCode.NotFound));
            }
            catch (InvalidTimeZoneException)
            {
                return Result<CheckoutPricing>.Failure(new ApplicationError(ErrorCode.NotFound));
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

        return Result<CheckoutPricing>.Success(new CheckoutPricing(catalog, normalizedCode, snapshots, discountAmount));
    }
    private static Result<CheckoutPricing> Validation(string field, string code, string message) =>
        Result<CheckoutPricing>.Failure(new ApplicationError(ErrorCode.ValidationFailed, new ValidationIssue(field, code, message)));
}
