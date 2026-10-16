using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed record ThemePublicationSnapshot(
    ThemeAppearance Appearance,
    Guid? LogoAssetId,
    Guid? FaviconAssetId,
    Guid? BannerAssetId,
    int SourceDraftVersion,
    DateTimeOffset? PublishedAt)
{
    public static ThemePublicationSnapshot Initial(int sourceDraftVersion = 1,
        Guid? logoAssetId = null, Guid? faviconAssetId = null, Guid? bannerAssetId = null) =>
        new(new ThemeAppearance(), logoAssetId, faviconAssetId, bannerAssetId, sourceDraftVersion, null);

    public Guid? AssetIdFor(string slot) => slot switch
    {
        "logo" => LogoAssetId,
        "favicon" => FaviconAssetId,
        "banner" => BannerAssetId,
        _ => null
    };

    public void Validate()
    {
        if (Appearance is null || SourceDraftVersion < 1)
            throw new DomainRuleException("invalid_theme_publication", "publication", "The publication state is invalid.");
        Appearance.ValidateForPublication(BannerAssetId is not null);
    }
}
