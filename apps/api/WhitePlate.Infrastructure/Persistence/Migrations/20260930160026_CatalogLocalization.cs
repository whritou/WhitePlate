using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CatalogLocalization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultMenuLocale",
                table: "Tenants",
                type: "character varying(128)",
                maxLength: 128,
                nullable: false,
                defaultValue: "en");

            migrationBuilder.AddColumn<string>(
                name: "MenuLocalesJson",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "[\"en\"]");

            migrationBuilder.AddColumn<string>(
                name: "TranslationsJson",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "TranslationsJson",
                table: "ProductOptions",
                type: "text",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "TranslationsJson",
                table: "ProductOptionGroups",
                type: "text",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "TranslationsJson",
                table: "MenuCategories",
                type: "text",
                nullable: false,
                defaultValue: "{}");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultMenuLocale",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "MenuLocalesJson",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TranslationsJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "TranslationsJson",
                table: "ProductOptions");

            migrationBuilder.DropColumn(
                name: "TranslationsJson",
                table: "ProductOptionGroups");

            migrationBuilder.DropColumn(
                name: "TranslationsJson",
                table: "MenuCategories");
        }
    }
}
