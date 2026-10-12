using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PickupScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PickupSchedulingJson",
                table: "Tenants",
                type: "jsonb",
                nullable: false,
                defaultValue: "{\"IntervalMinutes\":15,\"MinimumLeadMinutes\":20,\"Capacity\":8}");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PickupAt",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "PickupAtTicks",
                table: "Orders",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PickupSchedulingJson",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "PickupAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "PickupAtTicks",
                table: "Orders");
        }
    }
}
