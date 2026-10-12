using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OpeningHours : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OpeningHoursJson",
                table: "Tenants",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OpeningHoursJson",
                table: "Tenants");
        }
    }
}
