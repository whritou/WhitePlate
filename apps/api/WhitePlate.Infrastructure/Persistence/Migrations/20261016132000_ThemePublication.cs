using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ThemePublication : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PublishedThemeJson",
                table: "Tenants",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ThemePublicationVersion",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "IsInPublishedTheme",
                table: "MediaAssets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_TenantId_IsInPublishedTheme",
                table: "MediaAssets",
                columns: new[] { "TenantId", "IsInPublishedTheme" });

            // Preserve each existing storefront's current public behavior during the rollout:
            // default appearance plus the active saved T1 brand slots. Drafts remain unpublished.
            migrationBuilder.Sql("""
                UPDATE "Tenants" AS tenant
                SET "PublishedThemeJson" = jsonb_build_object(
                    'Appearance', jsonb_build_object(
                        'Primary', '#1f7a4d', 'Accent', '#c8f04a', 'Bg', '#f7f8f4', 'Text', '#14201a',
                        'Font', 'Space Grotesk', 'HeadingFont', 'Space Grotesk', 'HeadingWeight', 700,
                        'BodyWeight', 400, 'TextScale', 1.0, 'LineHeight', 1.5, 'ButtonRadius', 12,
                        'ButtonStyle', 'solid', 'Spacing', 'comfortable', 'ImageRatio', 'landscape',
                        'BannerHeight', 300, 'BannerAlign', 'left', 'BannerOverlay', 65,
                        'ShowRestaurantInfo', true, 'Radius', 12, 'Layout', 'grid', 'ShowBanner', true,
                        'Ambiance', 'custom'),
                    'LogoAssetId', (SELECT to_jsonb(asset."Id") FROM "MediaAssets" AS asset
                        WHERE asset."TenantId" = tenant."Id" AND asset."ProductId" IS NULL
                          AND asset."Slot" = 'logo' AND asset."IsActive" LIMIT 1),
                    'FaviconAssetId', (SELECT to_jsonb(asset."Id") FROM "MediaAssets" AS asset
                        WHERE asset."TenantId" = tenant."Id" AND asset."ProductId" IS NULL
                          AND asset."Slot" = 'favicon' AND asset."IsActive" LIMIT 1),
                    'BannerAssetId', (SELECT to_jsonb(asset."Id") FROM "MediaAssets" AS asset
                        WHERE asset."TenantId" = tenant."Id" AND asset."ProductId" IS NULL
                          AND asset."Slot" = 'banner' AND asset."IsActive" LIMIT 1),
                    'SourceDraftVersion', tenant."ThemeDraftVersion",
                    'PublishedAt', NULL);

                UPDATE "MediaAssets"
                SET "IsInPublishedTheme" = TRUE
                WHERE "ProductId" IS NULL AND "IsActive" = TRUE
                  AND "Slot" IN ('logo', 'favicon', 'banner');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MediaAssets_TenantId_IsInPublishedTheme",
                table: "MediaAssets");

            migrationBuilder.DropColumn(
                name: "PublishedThemeJson",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ThemePublicationVersion",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "IsInPublishedTheme",
                table: "MediaAssets");
        }
    }
}
