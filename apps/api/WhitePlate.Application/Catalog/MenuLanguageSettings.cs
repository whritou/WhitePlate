using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed record MenuLanguageSettingsDto(Guid TenantId, IReadOnlyList<string> Locales, string DefaultLocale);

public sealed class MenuLanguageSettingsHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<MenuLanguageSettingsDto>> GetAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<MenuLanguageSettingsDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        var settings = await catalog.GetMenuLanguageSettingsAsync(tenantId, cancellationToken);
        return settings is null
            ? Result<MenuLanguageSettingsDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<MenuLanguageSettingsDto>.Success(settings);
    }

    public async Task<Result<MenuLanguageSettingsDto>> UpdateAsync(Guid tenantId, ExternalIdentity identity,
        IReadOnlyList<string>? locales, string? defaultLocale, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<MenuLanguageSettingsDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var result = await catalog.UpdateMenuLanguageSettingsAsync(tenantId, locales ?? [], defaultLocale ?? "",
                cancellationToken);
            return result is null
                ? Result<MenuLanguageSettingsDto>.Failure(new ApplicationError(ErrorCode.NotFound))
                : Result<MenuLanguageSettingsDto>.Success(result);
        }
        catch (DomainRuleException exception)
        {
            return Result<MenuLanguageSettingsDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    public async Task<Result<bool>> TranslateAsync(Guid tenantId, Guid entityId, string entityType,
        ExternalIdentity identity, string locale, string name, string? description,
        CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var result = await catalog.SetTranslationAsync(tenantId, entityType, entityId, locale, name,
                description, cancellationToken);
            return result ? Result<bool>.Success(true) : Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        }
        catch (DomainRuleException exception)
        {
            return Result<bool>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }
}
