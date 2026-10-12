using WhitePlate.Domain.Common;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Tests.Domain;

public sealed class OrganizationTests
{
    [Fact]
    public void CreatesAnOrganizationWithTrimmedNameAndGeneratedId()
    {
        var organization = Organization.Create("  Acme Restaurants  ");

        Assert.NotEqual(Guid.Empty, organization.Id);
        Assert.Equal("Acme Restaurants", organization.Name);
        Assert.True(organization.IsActive);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    public void RejectsAnEmptyOrganizationName(string? name) =>
        Assert.Throws<DomainRuleException>(() => Organization.Create(name));

    [Fact]
    public void RejectsAnOrganizationNameLongerThanTwoHundredCharacters() =>
        Assert.Throws<DomainRuleException>(() => Organization.Create(new string('x', 201)));

    [Fact]
    public void RenameTrimsNewNameAndRejectsEmptyName()
    {
        var organization = Organization.Create("Acme");

        organization.Rename("  New Name  ");

        Assert.Equal("New Name", organization.Name);
        Assert.Throws<DomainRuleException>(() => organization.Rename(" "));
    }

    [Fact]
    public void SavesAValidFrenchLegalProfileWithoutChangingOrganizationName()
    {
        var organization = Organization.Create("Bistro");

        organization.SetLegalProfile("fr", "  Bistro SAS  ", "732829320", "FR88732829320", null);

        Assert.Equal("Bistro", organization.Name);
        Assert.Equal("FR", organization.LegalCountryCode);
        Assert.Equal("Bistro SAS", organization.LegalName);
        Assert.Equal("732829320", organization.LegalRegistrationNumber);
        Assert.Equal("FR88732829320", organization.TaxIdentifier);
    }

    [Theory]
    [InlineData("CA", null, null)]
    [InlineData("FR", "12345678", null)]
    [InlineData("FR", null, "FR12")]
    [InlineData("US", null, "12345678")]
    public void RejectsUnsupportedJurisdictionOrMalformedLegalIdentifiers(string country, string? registration,
        string? taxIdentifier)
    {
        var organization = Organization.Create("Bistro");

        Assert.Throws<DomainRuleException>(() => organization.SetLegalProfile(country, null, registration,
            taxIdentifier, null));
    }

    [Theory]
    [InlineData("DE", "HRB 12345", "DE123456789")]
    [InlineData("GB", "01234567", "GB123456789")]
    [InlineData("GB", "SC123456", "GBGD123")]
    [InlineData("US", "12-3456789", "12-3456789")]
    public void AcceptsSyntacticallyValidCountrySpecificIdentifiers(string country, string registration, string tax)
    {
        var organization = Organization.Create("Bistro");

        organization.SetLegalProfile(country, null, registration, tax, null);

        Assert.Equal(country, organization.LegalCountryCode);
    }
}
