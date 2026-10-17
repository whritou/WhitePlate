using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WhitePlate.Infrastructure.Persistence;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations;

public sealed partial class AnalyticsLive : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "AnalyticsSource",
            table: "Orders",
            type: "character varying(8)",
            maxLength: 8,
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "AnalyticsConsentedAt",
            table: "Orders",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<bool>(
            name: "AnalyticsReturningCustomer",
            table: "Orders",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.CreateTable(
            name: "OrderAnalyticsFingerprints",
            columns: table => new
            {
                TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                KeyVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                FingerprintHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_OrderAnalyticsFingerprints", x => new { x.TenantId, x.OrderId, x.KeyVersion });
                table.ForeignKey(
                    name: "FK_OrderAnalyticsFingerprints_Orders_OrderId",
                    column: x => x.OrderId,
                    principalTable: "Orders",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_OrderAnalyticsFingerprints_ExpiresAt",
            table: "OrderAnalyticsFingerprints",
            column: "ExpiresAt");

        migrationBuilder.CreateIndex(
            name: "IX_OrderAnalyticsFingerprints_TenantId_KeyVersion_FingerprintHash",
            table: "OrderAnalyticsFingerprints",
            columns: new[] { "TenantId", "KeyVersion", "FingerprintHash" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "OrderAnalyticsFingerprints");
        migrationBuilder.DropColumn(name: "AnalyticsSource", table: "Orders");
        migrationBuilder.DropColumn(name: "AnalyticsConsentedAt", table: "Orders");
        migrationBuilder.DropColumn(name: "AnalyticsReturningCustomer", table: "Orders");
    }
}
