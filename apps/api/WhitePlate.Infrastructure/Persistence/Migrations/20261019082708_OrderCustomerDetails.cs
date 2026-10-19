using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OrderCustomerDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomerPhone",
                table: "Orders",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderNotes",
                table: "Orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerPhone",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OrderNotes",
                table: "Orders");
        }
    }
}
