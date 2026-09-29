using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed class CreateOrderCommandHandler(IOrderRepository orders, TimeProvider timeProvider)
{
    private static readonly JsonSerializerOptions FingerprintJson = new(JsonSerializerDefaults.Web);

    public async Task<Result<OrderReceiptDto>> HandleAsync(CreateOrderCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();

        if (!IsValidIdempotencyKey(command.IdempotencyKey))
            return Validation("Idempotency-Key", "required", "A valid Idempotency-Key header is required.");

        var key = command.IdempotencyKey!.Trim();
        var keyHash = Hash(key);
        var requestHash = Hash(CreateFingerprint(command));
        var now = timeProvider.GetUtcNow();
        var existing = await orders.FindIdempotentOrderAsync(command.TenantId, keyHash, requestHash, now,
            cancellationToken);
        if (existing.Outcome == IdempotencyOutcome.Replayed)
            return Result<OrderReceiptDto>.Success(existing.Receipt!);
        if (existing.Outcome == IdempotencyOutcome.Conflict)
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
        var catalog = await orders.GetCheckoutCatalogAsync(command.TenantId,
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
                        selection.Option.PriceAdjustment)).ToArray()));
        }

        if (normalizedCode is not null && catalog.Discount is null)
            return Validation("discountCode", "invalid_discount", "The discount code is not valid for this restaurant.");

        try
        {
            var subtotal = snapshots.Sum(line =>
                (line.BaseUnitPrice + line.Options.Sum(option => option.PriceAdjustment)) * line.Quantity);
            var discountAmount = catalog.Discount switch
            {
                { Kind: DiscountKind.FixedAmount } discount => Math.Min(subtotal, discount.Value),
                { Kind: DiscountKind.Percentage } discount =>
                    decimal.Round(subtotal * discount.Value / 100m, 2, MidpointRounding.AwayFromZero),
                _ => 0m
            };
            var order = Order.Create(command.TenantId, catalog.Currency, command.CustomerName, snapshots,
                normalizedCode, discountAmount, now);
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

    private static string CreateFingerprint(CreateOrderCommand command)
    {
        var canonical = new
        {
            customerName = command.CustomerName?.Trim(),
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
