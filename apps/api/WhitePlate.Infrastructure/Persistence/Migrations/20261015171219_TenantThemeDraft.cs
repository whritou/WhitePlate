using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TenantThemeDraft : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThemeDraftJson",
                table: "Tenants",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ThemeDraftVersion",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThemeDraftJson",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ThemeDraftVersion",
                table: "Tenants");
        }
    }
}
