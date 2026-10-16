using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class M3CatalogTranslationWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CatalogTranslationGlossaryTerms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SourceLocale = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    TargetLocale = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    SourceTerm = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    SourceTermKey = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    TargetTerm = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogTranslationGlossaryTerms", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogTranslationGlossaryTerms_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CatalogTranslationReviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    EntityType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    Locale = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SourceFingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SavedTranslationFingerprint = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    AuthorIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    AuthorSubject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReviewerIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReviewerSubject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogTranslationReviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CatalogTranslationReviews_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CatalogTranslationGlossaryTerms_TenantId_SourceLocale_Targe~",
                table: "CatalogTranslationGlossaryTerms",
                columns: new[] { "TenantId", "SourceLocale", "TargetLocale", "SourceTermKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CatalogTranslationReviews_TenantId_EntityType_EntityId_Loca~",
                table: "CatalogTranslationReviews",
                columns: new[] { "TenantId", "EntityType", "EntityId", "Locale", "Version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CatalogTranslationReviews_TenantId_Status_CreatedAt",
                table: "CatalogTranslationReviews",
                columns: new[] { "TenantId", "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogTranslationGlossaryTerms");

            migrationBuilder.DropTable(
                name: "CatalogTranslationReviews");
        }
    }
}
