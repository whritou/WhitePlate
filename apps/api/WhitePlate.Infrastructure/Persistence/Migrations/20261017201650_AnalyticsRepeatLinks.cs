using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AnalyticsRepeatLinks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrderAnalyticsRepeatLinks",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    PriorOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderAnalyticsRepeatLinks", x => new { x.TenantId, x.OrderId, x.PriorOrderId });
                    table.ForeignKey(
                        name: "FK_OrderAnalyticsRepeatLinks_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrderAnalyticsRepeatLinks_Orders_PriorOrderId",
                        column: x => x.PriorOrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_OrderAnalyticsFingerprints_OrderId",
                table: "OrderAnalyticsFingerprints",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAnalyticsRepeatLinks_ExpiresAt",
                table: "OrderAnalyticsRepeatLinks",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAnalyticsRepeatLinks_OrderId",
                table: "OrderAnalyticsRepeatLinks",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAnalyticsRepeatLinks_PriorOrderId",
                table: "OrderAnalyticsRepeatLinks",
                column: "PriorOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderAnalyticsRepeatLinks_TenantId_PriorOrderId_ExpiresAt",
                table: "OrderAnalyticsRepeatLinks",
                columns: new[] { "TenantId", "PriorOrderId", "ExpiresAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderAnalyticsRepeatLinks");

            migrationBuilder.DropIndex(
                name: "IX_OrderAnalyticsFingerprints_OrderId",
                table: "OrderAnalyticsFingerprints");
        }
    }
}
