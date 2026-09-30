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
}
