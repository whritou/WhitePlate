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

    [Fact]
    public void ProductMetadataNormalizesSkuAndKeepsExplicitDeclarations()
    {
        var product = Product.Create(Guid.NewGuid(), Guid.NewGuid(), "Soup", null, 8.50m, 10m, 0);

        product.SetMetadata(" soup-01 ", ["milk", "cerealsWithGluten"], ["sesame"], ["vegetarian"],
            15, new Dictionary<string, string> { ["fr"] = "Préparé à la commande" });

        Assert.Equal("SOUP-01", product.Sku);
        Assert.Equal(["cerealsWithGluten", "milk"], product.ContainsAllergens);
        Assert.Equal(["sesame"], product.MayContainAllergens);
        Assert.Equal(["vegetarian"], product.DietaryTags);
        Assert.Equal(15, product.PreparationMinutes);
        Assert.Equal("Préparé à la commande", product.PreparationNotes["fr"]);
    }

    [Fact]
    public void ProductMetadataRejectsUnknownAllergensAndOverlappingDeclarations()
    {
        var product = Product.Create(Guid.NewGuid(), Guid.NewGuid(), "Soup", null, 8.50m, 10m, 0);

        Assert.Throws<DomainRuleException>(() => product.SetMetadata(null, ["not-an-allergen"], [], [], null, null));
        Assert.Throws<DomainRuleException>(() => product.SetMetadata(null, ["milk"], ["milk"], [], null, null));
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

    [Fact]
    public void DiscountStoresMinimumOrderAndInclusiveExpiryDateAndRejectsInvalidMinimums()
    {
        var expiresOn = new DateOnly(2026, 12, 31);
        var discount = PromotionDiscount.Create(Guid.NewGuid(), "SAVE", "Save", DiscountKind.FixedAmount, 2m,
            minimumOrderAmount: 25m, expiresOn: expiresOn);

        Assert.Equal(25m, discount.MinimumOrderAmount);
        Assert.Equal(expiresOn, discount.ExpiresOn);
        Assert.Throws<DomainRuleException>(() => PromotionDiscount.Create(Guid.NewGuid(), "LOW", "Low",
            DiscountKind.FixedAmount, 2m, minimumOrderAmount: -0.01m));
        Assert.Throws<DomainRuleException>(() => PromotionDiscount.Create(Guid.NewGuid(), "PRECISION", "Precision",
            DiscountKind.FixedAmount, 2m, minimumOrderAmount: 1.001m));
    }
}
