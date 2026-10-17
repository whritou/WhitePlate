using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Media;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed class ThemeSettingsHandler(IStaffMembershipRepository memberships,
    IThemeSettingsRepository repository, BrandMediaService media, ILogoPaletteExtractor palettes)
{
    public async Task<Result<ThemeDraftDto>> GetAsync(Guid tenantId, ExternalIdentity identity, CancellationToken ct)
    {
        if (!await StorefrontAccess.CanManageAsync(memberships, tenantId, identity, ct)) return Fail<ThemeDraftDto>(ErrorCode.NotFound);
        var tenant = await repository.GetAsync(tenantId, ct);
        return tenant is null ? Fail<ThemeDraftDto>(ErrorCode.NotFound) : Result<ThemeDraftDto>.Success(ToDto(tenant));
    }

    public async Task<Result<ThemeDraftDto>> SaveAsync(Guid tenantId, ExternalIdentity identity,
        ThemeAppearance theme, int? expectedVersion, CancellationToken ct)
    {
        if (!await StorefrontAccess.CanManageAsync(memberships, tenantId, identity, ct)) return Fail<ThemeDraftDto>(ErrorCode.NotFound);
        var tenant = await repository.GetAsync(tenantId, ct);
        if (tenant is null) return Fail<ThemeDraftDto>(ErrorCode.NotFound);
        if (expectedVersion is null) return Fail<ThemeDraftDto>(ErrorCode.PreconditionRequired);
        if (tenant.ThemeDraftVersion != expectedVersion) return Fail<ThemeDraftDto>(ErrorCode.PreconditionFailed);
        try
        {
            tenant.SetThemeDraft(theme);
            if (!await repository.SaveAsync(tenant, identity, expectedVersion.Value, ct))
                return await StorefrontAccess.CanManageAsync(memberships, tenantId, identity, ct)
                    ? Fail<ThemeDraftDto>(ErrorCode.PreconditionFailed) : Fail<ThemeDraftDto>(ErrorCode.NotFound);
            return Result<ThemeDraftDto>.Success(ToDto(tenant));
        }
        catch (DomainRuleException exception)
        {
            return Result<ThemeDraftDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    public async Task<Result<ThemePaletteDto>> PaletteAsync(Guid tenantId, ExternalIdentity identity, CancellationToken ct)
    {
        var access = await media.ListAsync(tenantId, identity, ct);
        if (!access.IsSuccess) return Result<ThemePaletteDto>.Failure(access.Error);
        if (!access.Value.Assets.Any(asset => asset.Slot == "logo"))
            return Result<ThemePaletteDto>.Success(new(null, "no_logo"));
        if (!access.Value.StorageAvailable) return Result<ThemePaletteDto>.Success(new(null, "unavailable"));
        var logo = access.Value.Assets.Single(asset => asset.Slot == "logo");
        var content = await media.PreviewAsync(tenantId, logo.Id, identity, ct);
        if (!content.IsSuccess)
            return content.Error.Code == ErrorCode.Unavailable
                ? Result<ThemePaletteDto>.Success(new(null, "unavailable"))
                : Result<ThemePaletteDto>.Failure(content.Error);
        var palette = await palettes.ExtractAsync(content.Value.Bytes, ct);
        return Result<ThemePaletteDto>.Success(new(palette, palette is null ? "unusable" : null));
    }

    private static ThemeDraftDto ToDto(Tenant tenant)
    {
        var theme = tenant.GetThemeDraft();
        var text = ThemeAppearance.Contrast(theme.Text, theme.Bg);
        var primary = ThemeAppearance.Contrast(theme.Primary, theme.Bg);
        var accent = ThemeAppearance.Contrast(theme.Text, theme.Accent);
        return new(theme, tenant.ThemeDraftVersion,
            new(text, primary, accent, primary, text >= 4.5 && primary >= 4.5 && accent >= 4.5));
    }

    private static Result<T> Fail<T>(ErrorCode code) => Result<T>.Failure(new ApplicationError(code));
}
