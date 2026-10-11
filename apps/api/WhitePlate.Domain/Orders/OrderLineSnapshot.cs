using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Orders;

public sealed record OrderOptionSnapshot(Guid OptionId, string Name, decimal PriceAdjustment);
public sealed record OrderLineSnapshot(Guid ProductId, string ProductName, decimal BaseUnitPrice,
    decimal TaxRatePercent, int Quantity, IReadOnlyList<OrderOptionSnapshot> Options)
{
    public IReadOnlyList<string> ContainsAllergens { get; init; } = [];
    public IReadOnlyList<string> MayContainAllergens { get; init; } = [];
    public IReadOnlyList<string> DietaryTags { get; init; } = [];
    public int? PreparationMinutes { get; init; }
    public IReadOnlyDictionary<string, string> PreparationNotes { get; init; } = new Dictionary<string, string>();
}
