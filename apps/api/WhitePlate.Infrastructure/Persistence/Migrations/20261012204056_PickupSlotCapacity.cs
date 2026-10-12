using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PickupSlotCapacity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PickupSlotReservations",
                columns: table => new
                {
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotStartTicks = table.Column<long>(type: "bigint", nullable: false),
                    ReleasedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickupSlotReservations", x => x.OrderId);
                    table.ForeignKey(
                        name: "FK_PickupSlotReservations_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PickupSlotUsages",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    SlotStartTicks = table.Column<long>(type: "bigint", nullable: false),
                    ReservedCount = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PickupSlotUsages", x => new { x.TenantId, x.SlotStartTicks });
                    table.ForeignKey(
                        name: "FK_PickupSlotUsages_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PickupSlotReservations_TenantId_SlotStartTicks_ReleasedAt",
                table: "PickupSlotReservations",
                columns: new[] { "TenantId", "SlotStartTicks", "ReleasedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PickupSlotReservations");

            migrationBuilder.DropTable(
                name: "PickupSlotUsages");
        }
    }
}
