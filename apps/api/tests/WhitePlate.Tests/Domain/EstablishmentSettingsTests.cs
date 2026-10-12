using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Domain;

public sealed class EstablishmentSettingsTests
{
    [Fact]
    public void NormalizesInternationalIdentityAndOptionalClearing()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        Assert.Equal("UTC", tenant.TimeZone);
        tenant.UpdateEstablishment(new(" Café ", Phone: " +44 (020) 1234-5678 ", AddressLine1: " 1 High Street ",
            PostalCode: "SW1A 1AA", City: "London", CountryCode: "gb", Latitude: 0, Longitude: -0.1234567m));
        Assert.Equal("Café", tenant.Name);
        Assert.Equal("GB", tenant.CountryCode);
        Assert.Equal("SW1A 1AA", tenant.PostalCode);
        Assert.Equal(-0.123457m, tenant.Longitude);
        tenant.UpdateEstablishment(new("Café", Phone: " "));
        Assert.Null(tenant.Phone);
        Assert.Null(tenant.AddressLine1);
        Assert.Null(tenant.Latitude);
        Assert.Equal(3, tenant.EstablishmentVersion);
    }

    [Fact]
    public void NormalizesLocaleKeysAndRejectsDuplicateNormalizedTranslationsAtomically()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        tenant.UpdateEstablishment(new("Bistro", PickupInstructions: new Dictionary<string, string?> { [" EN "] = " Counter " }));
        Assert.Equal(("Counter", "en"), tenant.ResolvePickupInstructions("unsupported"));
        Assert.Throws<DomainRuleException>(() => tenant.UpdateEstablishment(new("Changed", PickupInstructions:
            new Dictionary<string, string?> { ["en"] = "New", ["EN"] = "Duplicate" })));
        Assert.Equal("Bistro", tenant.Name);
        Assert.Equal(("Counter", "en"), tenant.ResolvePickupInstructions("en"));
        Assert.Equal(2, tenant.EstablishmentVersion);
    }

    [Theory]
    [InlineData("name", 201)]
    [InlineData("phone", 41)]
    [InlineData("addressLine1", 201)]
    [InlineData("addressLine2", 201)]
    [InlineData("postalCode", 21)]
    [InlineData("city", 101)]
    [InlineData("region", 101)]
    [InlineData("timeZone", 101)]
    public void RejectsOversizedFieldsBeforeAssigning(string field, int length)
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        var text = new string('x', length);
        var input = new EstablishmentInput("Changed", AddressLine1: "Address", City: "City", CountryCode: "GB");
        input = field switch
        {
            "name" => input with { Name = text }, "phone" => input with { Phone = text },
            "addressLine1" => input with { AddressLine1 = text }, "addressLine2" => input with { AddressLine2 = text },
            "postalCode" => input with { PostalCode = text }, "city" => input with { City = text },
            "region" => input with { Region = text }, _ => input with { TimeZone = text }
        };
        Assert.Throws<DomainRuleException>(() => tenant.UpdateEstablishment(input));
        Assert.Equal("Bistro", tenant.Name);
        Assert.Equal(1, tenant.EstablishmentVersion);
    }

    [Theory]
    [InlineData(91, 0)]
    [InlineData(-91, 0)]
    [InlineData(0, 181)]
    public void InvalidCoordinatesDoNotPartiallyRenameTenant(decimal latitude, decimal longitude)
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        Assert.Throws<DomainRuleException>(() => tenant.UpdateEstablishment(new("Changed", Latitude: latitude, Longitude: longitude)));
        Assert.Equal("Bistro", tenant.Name);
        Assert.Equal(1, tenant.EstablishmentVersion);
    }

    [Fact]
    public void PickupInstructionsPreserveDisabledLanguagesAndClearWithFallback()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        tenant.UpdateMenuLocales(["en", "fr"], "en");
        tenant.UpdateEstablishment(new("Bistro", PickupInstructions: new Dictionary<string, string?> { ["en"] = "Counter", ["fr"] = "Comptoir" }));
        tenant.UpdateMenuLocales(["en"], "en");
        Assert.Equal(("Counter", "en"), tenant.ResolvePickupInstructions("fr"));
        Assert.False(tenant.GetPickupInstructions().ContainsKey("fr"));
        tenant.UpdateEstablishment(new("Bistro", PickupInstructions: new Dictionary<string, string?> { ["en"] = " New counter " }));
        tenant.UpdateMenuLocales(["en", "fr"], "en");
        Assert.Equal(("Comptoir", "fr"), tenant.ResolvePickupInstructions("fr"));
        tenant.UpdateEstablishment(new("Bistro", PickupInstructions: new Dictionary<string, string?> { ["fr"] = " " }));
        Assert.Equal(("New counter", "en"), tenant.ResolvePickupInstructions("fr"));
    }

    [Theory]
    [InlineData("addressLine1")]
    [InlineData("phone")]
    [InlineData("pickupInstructions")]
    public void RejectsIncompleteAddressUnsafePhoneAndDisabledTranslation(string field)
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        var input = field switch
        {
            "addressLine1" => new EstablishmentInput("Changed", City: "Paris"),
            "phone" => new EstablishmentInput("Changed", Phone: "javascript:alert(1)"),
            _ => new EstablishmentInput("Changed", PickupInstructions: new Dictionary<string, string?> { ["fr"] = "Comptoir" })
        };
        Assert.Throws<DomainRuleException>(() => tenant.UpdateEstablishment(input));
        Assert.Equal("Bistro", tenant.Name);
    }
}
