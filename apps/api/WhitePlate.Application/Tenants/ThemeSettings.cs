using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed record ThemeContrastDto(double TextOnBackground, double PrimaryOnBackground,
    double TextOnAccent, double BackgroundOnPrimary, bool ReadyForPublication);
public sealed record ThemeDraftDto(ThemeAppearance Theme, int Version, ThemeContrastDto Contrast);
public sealed record ThemePalette(string Primary, string Accent, string Bg, string Text);
public sealed record ThemePaletteDto(ThemePalette? Palette, string? Reason);

public interface IThemeSettingsRepository
{
    Task<Tenant?> GetAsync(Guid tenantId, CancellationToken ct);
    Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, CancellationToken ct);
}

public interface ILogoPaletteExtractor
{
    Task<ThemePalette?> ExtractAsync(byte[] png, CancellationToken ct);
}
