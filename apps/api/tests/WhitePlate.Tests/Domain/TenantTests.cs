using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Domain;

public sealed class TenantTests
{
    [Fact]
    public void NormalizesIdentityAndName()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "  Bistro  ", "  My-Bistro ", " eur ");
        Assert.NotEqual(Guid.Empty, tenant.Id);
        Assert.Equal("Bistro", tenant.Name);
        Assert.Equal(TenantSubdomain.Create("my-bistro"), tenant.Subdomain);
        Assert.Equal("EUR", tenant.Currency);
        Assert.True(tenant.IsActive);
        tenant.Deactivate();
        Assert.False(tenant.IsActive);
    }

    [Theory]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("-bad")]
    [InlineData("bad-")]
    [InlineData("a.b")]
    [InlineData("a_b")]
    [InlineData("é")]
    public void RejectsInvalidSubdomains(string subdomain) =>
        Assert.Throws<DomainRuleException>(() => Tenant.Create(Guid.NewGuid(), "Bistro", subdomain, "EUR"));

    [Fact]
    public void EnforcesNameAndSubdomainBounds()
    {
        Assert.Throws<DomainRuleException>(() => Tenant.Create(Guid.NewGuid(), " ", "bistro", "EUR"));
        Assert.Throws<DomainRuleException>(() => Tenant.Create(Guid.NewGuid(), new string('a', 201), "bistro", "EUR"));
        Assert.Throws<DomainRuleException>(() => Tenant.Create(Guid.NewGuid(), "Bistro", new string('a', 64), "EUR"));
        Assert.Equal(63, Tenant.Create(Guid.NewGuid(), new string('a', 200), new string('a', 63), "EUR").Subdomain.Value.Length);
    }

    [Fact]
    public void RequiresOrganizationAndSupportedCurrency()
    {
        Assert.Throws<DomainRuleException>(() => Tenant.Create(Guid.Empty, "Bistro", "bistro", "EUR"));
        Assert.Throws<DomainRuleException>(() => Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "CAD"));
    }

    [Fact]
    public void ResolvesDescriptionByMenuLocaleThenDefault()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        tenant.UpdateMenuLocales(["en", "fr"], "en");
        tenant.SetDescriptionTranslation("en", "English description");
        tenant.SetDescriptionTranslation("fr", "Description française");

        Assert.Equal("Description française", tenant.ResolveDescription("fr"));
        tenant.SetDescriptionTranslation("fr", null);
        Assert.Equal("English description", tenant.ResolveDescription("fr"));
        Assert.Equal("English description", tenant.ResolveDescription("de"));
    }

    [Fact]
    public void ClearingDescriptionPreservesOtherLocaleTranslations()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        tenant.UpdateMenuLocales(["en", "fr"], "en");
        tenant.SetDescriptionTranslation("en", "  English intro  ");
        tenant.SetDescriptionTranslation("fr", "Description française");

        tenant.SetDescriptionTranslation("en", "   ");

        Assert.Null(tenant.ResolveDescription("en"));
        Assert.Equal("Description française", tenant.ResolveDescription("fr"));
    }

    [Fact]
    public void RejectsDisabledDescriptionLocaleAndDescriptionsOver500Characters()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");

        Assert.Throws<DomainRuleException>(() => tenant.SetDescriptionTranslation("fr", "Texte"));
        Assert.Throws<DomainRuleException>(() => tenant.SetDescriptionTranslation("en", new string('a', 501)));
    }
}
