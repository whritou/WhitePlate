namespace WhitePlate.Domain.Orders;

public sealed class OrderLine
{
    public Guid Id { get; private set; }
    public Guid OrderId { get; private set; }
    public Guid ProductId { get; private set; }
    public string ProductName { get; private set; } = null!;
    public decimal BaseUnitPrice { get; private set; }
    public decimal TaxRatePercent { get; private set; }
    public int Quantity { get; private set; }
    public decimal Subtotal { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal TaxAmount { get; private set; }
    public decimal Total { get; private set; }
    public List<OrderLineOption> Options { get; private set; } = [];
    private OrderLine() { }
    internal OrderLine(OrderLineSnapshot snapshot)
    {
        Id = Guid.NewGuid(); ProductId = snapshot.ProductId; ProductName = snapshot.ProductName;
        BaseUnitPrice = snapshot.BaseUnitPrice; TaxRatePercent = snapshot.TaxRatePercent; Quantity = snapshot.Quantity;
        Options = snapshot.Options.Select(option => new OrderLineOption(option)).ToList();
        Subtotal = decimal.Round((BaseUnitPrice + Options.Sum(item => item.PriceAdjustment)) * Quantity, 2, MidpointRounding.AwayFromZero);
    }
    internal void SetCalculatedAmounts(decimal discount)
    {
        DiscountAmount = discount;
        var taxable = Subtotal - discount;
        TaxAmount = decimal.Round(taxable * TaxRatePercent / 100m, 2, MidpointRounding.AwayFromZero);
        Total = taxable + TaxAmount;
    }
}

public sealed class OrderLineOption
{
    public Guid Id { get; private set; }
    public Guid OrderLineId { get; private set; }
    public Guid OptionId { get; private set; }
    public string Name { get; private set; } = null!;
    public decimal PriceAdjustment { get; private set; }
    private OrderLineOption() { }
    internal OrderLineOption(OrderOptionSnapshot snapshot)
    { Id = Guid.NewGuid(); OptionId = snapshot.OptionId; Name = snapshot.Name; PriceAdjustment = snapshot.PriceAdjustment; }
}
