using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed record QuoteOrderQuery(Guid TenantId, string? MenuLocale, string? DiscountCode,
    IReadOnlyList<CreateOrderItem>? Items);
public sealed record OrderQuoteDto(string Currency, decimal Subtotal, decimal DiscountAmount,
    decimal TaxAmount, decimal Total, IReadOnlyList<PublicOrderLineDto> Lines);

public sealed class QuoteOrderQueryHandler(IOrderRepository orders, TimeProvider timeProvider)
{
    public async Task<Result<OrderQuoteDto>> HandleAsync(QuoteOrderQuery query, CancellationToken cancellationToken)
    {
        var locale = await orders.ResolveCheckoutLocaleAsync(query.TenantId, query.MenuLocale, cancellationToken);
        if (locale is null) return Result<OrderQuoteDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        var now = timeProvider.GetUtcNow();
        var pricing = await CheckoutPricingReader.ReadAsync(orders, query.TenantId, locale, query.Items,
            query.DiscountCode, now, cancellationToken);
        if (!pricing.IsSuccess) return Result<OrderQuoteDto>.Failure(pricing.Error);
        try
        {
            var (catalog, code, lines, discount) = pricing.Value;
            // Reuse canonical tax allocation and rounding; this transient aggregate is never persisted.
            var receipt = Order.Create(query.TenantId, catalog.Currency, "Quote", lines, code, discount,
                now, catalog.Locale).ToReceipt();
            return Result<OrderQuoteDto>.Success(new OrderQuoteDto(receipt.Currency, receipt.Subtotal,
                receipt.DiscountAmount, receipt.TaxAmount, receipt.Total,
                receipt.Lines.Select(line => new PublicOrderLineDto(line.ProductId, line.ProductName,
                    line.Quantity, line.Subtotal, line.Total, line.Options)).ToArray()));
        }
        catch (DomainRuleException exception)
        {
            return Result<OrderQuoteDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }
}
