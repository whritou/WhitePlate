using System.Text.Json;
using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Tenants;

public sealed partial class Tenant
{
    public string? PublishedThemeJson { get; private set; }
    public int ThemePublicationVersion { get; private set; } = 1;

    public ThemePublicationSnapshot GetPublishedTheme() => PublishedThemeJson is null
        ? ThemePublicationSnapshot.Initial()
        : JsonSerializer.Deserialize<ThemePublicationSnapshot>(PublishedThemeJson)!;

    public bool SetPublishedTheme(ThemePublicationSnapshot snapshot, int expectedDraftVersion,
        int expectedPublicationVersion)
    {
        if (ThemeDraftVersion != expectedDraftVersion || ThemePublicationVersion != expectedPublicationVersion)
            return false;
        if (ThemePublicationVersion == int.MaxValue)
            throw new DomainRuleException("invalid_theme_publication", "version", "The publication version is invalid.");

        snapshot.Validate();
        PublishedThemeJson = JsonSerializer.Serialize(snapshot);
        ThemePublicationVersion++;
        return true;
    }
}
