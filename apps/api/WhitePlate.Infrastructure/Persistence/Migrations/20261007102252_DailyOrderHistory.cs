using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DailyOrderHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ArchivedAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "ClosedAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "ClosedAtTicks",
                table: "Orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Orders"
                SET "ClosedAt" = "CreatedAt", "ClosedAtTicks" = "CreatedAtTicks"
                WHERE "Status" IN ('Completed', 'Cancelled');
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_Status_ClosedAtTicks_ArchivedAt",
                table: "Orders",
                columns: new[] { "Status", "ClosedAtTicks", "ArchivedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Orders_Status_ClosedAtTicks_ArchivedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ClosedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ClosedAtTicks",
                table: "Orders");
        }
    }
}
