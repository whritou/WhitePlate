using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed record ThemePublicationDto(ThemeAppearance Theme, Guid? LogoAssetId, Guid? FaviconAssetId,
    Guid? BannerAssetId, int SourceDraftVersion, DateTimeOffset? PublishedAt, int Version);
public sealed record PublicThemeDto(ThemeAppearance Theme, bool HasLogo, bool HasFavicon, bool HasBanner,
    DateTimeOffset? PublishedAt, int Version);
public sealed record PublishThemeRequest(int DraftVersion);
public enum ThemePublicationWriteResult { Published, NotFound, PreconditionFailed }
public sealed record ThemePublicationWriteOutcome(ThemePublicationWriteResult Result,
    ThemePublicationDto? Publication = null);

public interface IThemePublicationRepository
{
    Task<Tenant?> GetAsync(Guid tenantId, CancellationToken ct);
    Task<ThemePublicationWriteOutcome> PublishAsync(Guid tenantId, ExternalIdentity identity,
        int draftVersion, int publicationVersion, DateTimeOffset now, CancellationToken ct);
    Task<Tenant?> GetPublicAsync(Guid tenantId, CancellationToken ct);
}

public sealed class ThemePublicationHandler(IStaffMembershipRepository memberships,
    IThemePublicationRepository repository, TimeProvider clock)
{
    public async Task<Result<ThemePublicationDto>> GetAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, ct))
            return Fail<ThemePublicationDto>(ErrorCode.NotFound);
        var tenant = await repository.GetAsync(tenantId, ct);
        return tenant is null ? Fail<ThemePublicationDto>(ErrorCode.NotFound) :
            Result<ThemePublicationDto>.Success(ToDto(tenant));
    }

    public async Task<Result<ThemePublicationDto>> PublishAsync(Guid tenantId, ExternalIdentity identity,
        PublishThemeRequest request, int? expectedPublicationVersion, CancellationToken ct)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, ct))
            return Fail<ThemePublicationDto>(ErrorCode.NotFound);
        if (expectedPublicationVersion is null) return Fail<ThemePublicationDto>(ErrorCode.PreconditionRequired);
        if (request.DraftVersion < 1) return Fail<ThemePublicationDto>(ErrorCode.ValidationFailed);

        try
        {
            var result = await repository.PublishAsync(tenantId, identity, request.DraftVersion,
                expectedPublicationVersion.Value, clock.GetUtcNow(), ct);
            if (result.Result == ThemePublicationWriteResult.NotFound) return Fail<ThemePublicationDto>(ErrorCode.NotFound);
            if (result.Result == ThemePublicationWriteResult.PreconditionFailed)
                return Fail<ThemePublicationDto>(ErrorCode.PreconditionFailed);
            return result.Publication is null ? Fail<ThemePublicationDto>(ErrorCode.Unexpected) :
                Result<ThemePublicationDto>.Success(result.Publication);
        }
        catch (WhitePlate.Domain.Common.DomainRuleException exception)
        {
            return Result<ThemePublicationDto>.Failure(new ApplicationError(ErrorCode.UnprocessableEntity,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    public async Task<Result<PublicThemeDto>> GetPublicAsync(Guid tenantId, CancellationToken ct)
    {
        var tenant = await repository.GetPublicAsync(tenantId, ct);
        if (tenant is null) return Fail<PublicThemeDto>(ErrorCode.NotFound);
        var publication = tenant.GetPublishedTheme();
        return Result<PublicThemeDto>.Success(new(publication.Appearance, publication.LogoAssetId is not null,
            publication.FaviconAssetId is not null, publication.BannerAssetId is not null,
            publication.PublishedAt, tenant.ThemePublicationVersion));
    }

    private static ThemePublicationDto ToDto(Tenant tenant)
    {
        var publication = tenant.GetPublishedTheme();
        return new(publication.Appearance, publication.LogoAssetId, publication.FaviconAssetId,
            publication.BannerAssetId, publication.SourceDraftVersion, publication.PublishedAt,
            tenant.ThemePublicationVersion);
    }

    private static Result<T> Fail<T>(ErrorCode code) => Result<T>.Failure(new ApplicationError(code));
}
