using System.Text.Json;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed partial class Tenant
{
    public string? ThemeDraftJson { get; private set; }
    public int ThemeDraftVersion { get; private set; } = 1;

    public ThemeAppearance GetThemeDraft() => ThemeDraftJson is null
        ? new() : JsonSerializer.Deserialize<ThemeAppearance>(ThemeDraftJson)!;

    public void SetThemeDraft(ThemeAppearance appearance)
    {
        appearance.Validate();
        if (ThemeDraftVersion == int.MaxValue)
            throw new DomainRuleException("invalid_theme", "version", "The theme version is invalid.");
        ThemeDraftJson = JsonSerializer.Serialize<ThemeAppearance>(appearance);
        ThemeDraftVersion++;
    }
}
