using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CatalogPublicationHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CatalogPublicationHeads",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    PublishedVersion = table.Column<int>(type: "integer", nullable: false),
                    SnapshotJson = table.Column<string>(type: "jsonb", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogPublicationHeads", x => x.TenantId);
                    table.ForeignKey(
                        name: "FK_CatalogPublicationHeads_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CatalogRevisions",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    SnapshotJson = table.Column<string>(type: "jsonb", nullable: false),
                    ChangeSetJson = table.Column<string>(type: "jsonb", nullable: false),
                    Action = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    SourceVersion = table.Column<int>(type: "integer", nullable: true),
                    ActorIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ActorSubject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PublishedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogRevisions", x => new { x.TenantId, x.Version });
                    table.ForeignKey(
                        name: "FK_CatalogRevisions_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CatalogRevisions_TenantId_PublishedAt",
                table: "CatalogRevisions",
                columns: new[] { "TenantId", "PublishedAt" });

            migrationBuilder.Sql("""
                CREATE TEMP TABLE "CatalogPublicationBackfill" ON COMMIT DROP AS
                SELECT tenant."Id" AS "TenantId",
                       jsonb_build_object(
                           'tenantId', tenant."Id",
                           'currency', tenant."Currency",
                           'defaultLocale', tenant."DefaultMenuLocale",
                           'locales', tenant."MenuLocalesJson"::jsonb,
                           'categories', COALESCE((
                               SELECT jsonb_agg(jsonb_build_object(
                                   'id', category."Id", 'name', category."Name", 'sortOrder', category."SortOrder",
                                   'isArchived', category."IsArchived", 'isVisible', category."IsVisible",
                                   'translations', category."TranslationsJson"::jsonb
                               ) ORDER BY category."SortOrder", category."Id")
                               FROM "MenuCategories" category WHERE category."TenantId" = tenant."Id"
                           ), '[]'::jsonb),
                           'products', COALESCE((
                               SELECT jsonb_agg(jsonb_build_object(
                                   'id', product."Id", 'categoryId', product."CategoryId", 'name', product."Name",
                                   'description', product."Description", 'basePrice', product."BasePrice",
                                   'taxRatePercent', product."TaxRatePercent", 'sortOrder', product."SortOrder",
                                   'isAvailable', product."IsAvailable", 'isArchived', product."IsArchived",
                                   'sku', product."Sku", 'containsAllergens', product."ContainsAllergensJson"::jsonb,
                                   'mayContainAllergens', product."MayContainAllergensJson"::jsonb,
                                   'dietaryTags', product."DietaryTagsJson"::jsonb,
                                   'preparationMinutes', product."PreparationMinutes",
                                   'preparationNotes', product."PreparationNotesJson"::jsonb,
                                   'translations', product."TranslationsJson"::jsonb
                               ) ORDER BY product."SortOrder", product."Id")
                               FROM "Products" product WHERE product."TenantId" = tenant."Id"
                           ), '[]'::jsonb),
                           'optionGroups', COALESCE((
                               SELECT jsonb_agg(jsonb_build_object(
                                   'id', option_group."Id", 'productId', option_group."ProductId",
                                   'name', option_group."Name", 'minimumSelections', option_group."MinimumSelections",
                                   'maximumSelections', option_group."MaximumSelections", 'sortOrder', option_group."SortOrder",
                                   'isArchived', option_group."IsArchived', 'translations', option_group."TranslationsJson"::jsonb
                               ) ORDER BY option_group."SortOrder", option_group."Id")
                               FROM "ProductOptionGroups" option_group WHERE option_group."TenantId" = tenant."Id"
                           ), '[]'::jsonb),
                           'options', COALESCE((
                               SELECT jsonb_agg(jsonb_build_object(
                                   'id', option."Id", 'groupId', option."GroupId", 'name', option."Name",
                                   'priceAdjustment', option."PriceAdjustment", 'sortOrder', option."SortOrder",
                                   'isArchived', option."IsArchived', 'translations', option."TranslationsJson"::jsonb
                               ) ORDER BY option."SortOrder", option."Id")
                               FROM "ProductOptions" option WHERE option."TenantId" = tenant."Id"
                           ), '[]'::jsonb),
                           'discounts', COALESCE((
                               SELECT jsonb_agg(jsonb_build_object(
                                   'id', discount."Id", 'code', discount."Code", 'name', discount."Name",
                                   'kind', discount."Kind", 'value', discount."Value", 'isActive', discount."IsActive",
                                   'minimumOrderAmount', discount."MinimumOrderAmount", 'expiresOn', discount."ExpiresOn"
                               ) ORDER BY discount."Code", discount."Id")
                               FROM "PromotionDiscounts" discount WHERE discount."TenantId" = tenant."Id"
                           ), '[]'::jsonb)
                       ) AS "SnapshotJson"
                FROM "Tenants" tenant;

                INSERT INTO "CatalogPublicationHeads" ("TenantId", "PublishedVersion", "SnapshotJson", "UpdatedAt")
                SELECT "TenantId", 1, "SnapshotJson", NOW() FROM "CatalogPublicationBackfill";

                INSERT INTO "CatalogRevisions" (
                    "TenantId", "Version", "SnapshotJson", "ChangeSetJson", "Action", "SourceVersion",
                    "ActorIssuer", "ActorSubject", "PublishedAt")
                SELECT "TenantId", 1, "SnapshotJson", '[]'::jsonb, 'baseline', NULL, 'system', 'migration', NOW()
                FROM "CatalogPublicationBackfill";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogPublicationHeads");

            migrationBuilder.DropTable(
                name: "CatalogRevisions");
        }
    }
}
