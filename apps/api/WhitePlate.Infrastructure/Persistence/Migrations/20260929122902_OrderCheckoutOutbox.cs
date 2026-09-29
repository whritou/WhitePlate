using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class OrderCheckoutOutbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "CreatedAtTicks",
                table: "Orders",
                type: "bigint",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Orders\" SET \"CreatedAtTicks\" = (EXTRACT(EPOCH FROM \"CreatedAt\") * 10000000 + 621355968000000000)::bigint;");

            migrationBuilder.AlterColumn<long>(
                name: "CreatedAtTicks",
                table: "Orders",
                type: "bigint",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "OrderIdempotencyRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    KeyHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    RequestHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ResponseJson = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderIdempotencyRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OrderOutboxMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PayloadJson = table.Column<string>(type: "text", nullable: false),
                    OccurredAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    AvailableAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LeaseUntil = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LeaseVersion = table.Column<int>(type: "integer", nullable: false),
                    Attempts = table.Column<int>(type: "integer", nullable: false),
                    DispatchedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrderOutboxMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrderOutboxMessages_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TenantId_CreatedAtTicks_Id",
                table: "Orders",
                columns: new[] { "TenantId", "CreatedAtTicks", "Id" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderIdempotencyRecords_ExpiresAt",
                table: "OrderIdempotencyRecords",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_OrderIdempotencyRecords_TenantId_KeyHash",
                table: "OrderIdempotencyRecords",
                columns: new[] { "TenantId", "KeyHash" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrderOutboxMessages_DispatchedAt_AvailableAt_LeaseUntil",
                table: "OrderOutboxMessages",
                columns: new[] { "DispatchedAt", "AvailableAt", "LeaseUntil" });

            migrationBuilder.CreateIndex(
                name: "IX_OrderOutboxMessages_TenantId_OccurredAt_Id",
                table: "OrderOutboxMessages",
                columns: new[] { "TenantId", "OccurredAt", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrderIdempotencyRecords");

            migrationBuilder.DropTable(
                name: "OrderOutboxMessages");

            migrationBuilder.DropIndex(
                name: "IX_Orders_TenantId_CreatedAtTicks_Id",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CreatedAtTicks",
                table: "Orders");
        }
    }
}
