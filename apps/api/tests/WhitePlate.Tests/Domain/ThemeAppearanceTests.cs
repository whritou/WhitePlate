using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Domain;

public sealed class ThemeAppearanceTests
{
    [Fact]
    public void ContrastUsesSrgbLuminanceAndDoesNotClaimFixedCompliance()
    {
        Assert.Equal(21, ThemeAppearance.Contrast("#000000", "#ffffff"), 8);
        Assert.Equal(1, ThemeAppearance.Contrast("#123456", "#123456"), 8);
        Assert.InRange(ThemeAppearance.Contrast("#777777", "#ffffff"), 4.47, 4.49);
    }

    [Fact]
    public void InvalidDraftPreservesPreviousSavedThemeAndVersion()
    {
        var tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        tenant.SetThemeDraft(new() { HeadingFont = "Playfair Display", TextScale = 1.2, Radius = 24 });
        var previous = tenant.ThemeDraftJson;
        Assert.Throws<DomainRuleException>(() => tenant.SetThemeDraft(new() { Primary = "red;display:none" }));
        Assert.Equal(previous, tenant.ThemeDraftJson);
        Assert.Equal(2, tenant.ThemeDraftVersion);
        Assert.Equal("Playfair Display", tenant.GetThemeDraft().HeadingFont);
        Assert.Equal(1.2, tenant.GetThemeDraft().TextScale);
    }
}
