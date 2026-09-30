using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Orders;

public sealed record OrderOptionSnapshot(Guid OptionId, string Name, decimal PriceAdjustment);
public sealed record OrderLineSnapshot(Guid ProductId, string ProductName, decimal BaseUnitPrice,
    decimal TaxRatePercent, int Quantity, IReadOnlyList<OrderOptionSnapshot> Options);
