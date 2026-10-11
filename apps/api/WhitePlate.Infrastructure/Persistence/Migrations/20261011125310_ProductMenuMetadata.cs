using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProductMenuMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContainsAllergensJson",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "DietaryTagsJson",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "MayContainAllergensJson",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<int>(
                name: "PreparationMinutes",
                table: "Products",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreparationNotesJson",
                table: "Products",
                type: "text",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<string>(
                name: "Sku",
                table: "Products",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContainsAllergensJson",
                table: "OrderLines",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "DietaryTagsJson",
                table: "OrderLines",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "MayContainAllergensJson",
                table: "OrderLines",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<int>(
                name: "PreparationMinutes",
                table: "OrderLines",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreparationNotesJson",
                table: "OrderLines",
                type: "text",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.CreateIndex(
                name: "IX_Products_TenantId_Sku",
                table: "Products",
                columns: new[] { "TenantId", "Sku" },
                unique: true,
                filter: "\"Sku\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Products_TenantId_Sku",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ContainsAllergensJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "DietaryTagsJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "MayContainAllergensJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PreparationMinutes",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PreparationNotesJson",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Sku",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ContainsAllergensJson",
                table: "OrderLines");

            migrationBuilder.DropColumn(
                name: "DietaryTagsJson",
                table: "OrderLines");

            migrationBuilder.DropColumn(
                name: "MayContainAllergensJson",
                table: "OrderLines");

            migrationBuilder.DropColumn(
                name: "PreparationMinutes",
                table: "OrderLines");

            migrationBuilder.DropColumn(
                name: "PreparationNotesJson",
                table: "OrderLines");
        }
    }
}
