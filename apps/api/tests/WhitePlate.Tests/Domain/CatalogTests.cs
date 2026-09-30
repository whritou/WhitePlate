using WhitePlate.Domain.Common;
using WhitePlate.Domain.Catalog;

namespace WhitePlate.Tests.Domain;

public sealed class CatalogTests
{
    [Fact]
    public void ProductKeepsPriceAndTaxRateAtTwoDecimalPrecision()
    {
        var tenantId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();
        var product = Product.Create(tenantId, categoryId, "Soup", "Seasonal soup", 8.50m, 10.25m, 1);

        Assert.Equal(tenantId, product.TenantId);
        Assert.Equal(categoryId, product.CategoryId);
        Assert.Equal(8.50m, product.BasePrice);
        Assert.Equal(10.25m, product.TaxRatePercent);
        Assert.True(product.IsAvailable);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(10, -0.01)]
    [InlineData(10, 100.01)]
    [InlineData(10.001, 10)]
    public void RejectsInvalidProductPriceOrTax(decimal price, decimal taxRate) =>
        Assert.Throws<DomainRuleException>(() => Product.Create(Guid.NewGuid(), Guid.NewGuid(), "Soup", null,
            price, taxRate, 0));

    [Fact]
    public void OptionGroupEnforcesMinimumAndMaximumSelectionBounds()
    {
        var group = ProductOptionGroup.Create(Guid.NewGuid(), Guid.NewGuid(), "Toppings", 1, 2, 0);
        Assert.Equal(1, group.MinimumSelections);
        Assert.Equal(2, group.MaximumSelections);
        Assert.Throws<DomainRuleException>(() => ProductOptionGroup.Create(Guid.NewGuid(), Guid.NewGuid(), "Toppings", 3, 2, 0));
    }

    [Fact]
    public void DiscountNormalizesCodeAndRejectsRatesOutsideZeroToOneHundred()
    {
        var discount = PromotionDiscount.Create(Guid.NewGuid(), " lunch10 ", "Lunch", DiscountKind.Percentage, 10m);
        Assert.Equal("LUNCH10", discount.Code);
        Assert.Throws<DomainRuleException>(() => PromotionDiscount.Create(Guid.NewGuid(), "BAD", "Bad", DiscountKind.Percentage, 100.01m));
        Assert.Throws<DomainRuleException>(() => PromotionDiscount.Create(Guid.NewGuid(), "BAD", "Bad", DiscountKind.FixedAmount, 0m));
    }
}
