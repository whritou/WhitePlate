using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StripeConnect : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StripeConnectConnections",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    StripeAccountId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ConnectionState = table.Column<int>(type: "integer", nullable: false),
                    ReadinessState = table.Column<int>(type: "integer", nullable: false),
                    DetailsSubmitted = table.Column<bool>(type: "boolean", nullable: false),
                    ChargesEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    PayoutsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CardPaymentsCapabilityStatus = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    CurrentlyDueCount = table.Column<int>(type: "integer", nullable: false),
                    PastDueCount = table.Column<int>(type: "integer", nullable: false),
                    PendingVerificationCount = table.Column<int>(type: "integer", nullable: false),
                    ConnectedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastVerifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    LastAppliedEventAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StripeConnectConnections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StripeConnectConnections_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StripeConnectOAuthStates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StateHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OwnerSubject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    Locale = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConsumedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StripeConnectOAuthStates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StripeConnectOAuthStates_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StripeConnectWebhookEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Mode = table.Column<int>(type: "integer", nullable: false),
                    EventId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    EventType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    StripeAccountId = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    EventCreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ReceivedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StripeConnectWebhookEvents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "UX_StripeConnectConnections_Mode_Account",
                table: "StripeConnectConnections",
                columns: new[] { "Mode", "StripeAccountId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "UX_StripeConnectConnections_Tenant_Mode",
                table: "StripeConnectConnections",
                columns: new[] { "TenantId", "Mode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StripeConnectOAuthStates_Expiry_Consumed",
                table: "StripeConnectOAuthStates",
                columns: new[] { "ExpiresAt", "ConsumedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_StripeConnectOAuthStates_TenantId",
                table: "StripeConnectOAuthStates",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "UX_StripeConnectOAuthStates_StateHash",
                table: "StripeConnectOAuthStates",
                column: "StateHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StripeConnectWebhookEvents_Mode_Account_Created",
                table: "StripeConnectWebhookEvents",
                columns: new[] { "Mode", "StripeAccountId", "EventCreatedAt" });

            migrationBuilder.CreateIndex(
                name: "UX_StripeConnectWebhookEvents_Mode_Event",
                table: "StripeConnectWebhookEvents",
                columns: new[] { "Mode", "EventId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StripeConnectConnections");

            migrationBuilder.DropTable(
                name: "StripeConnectOAuthStates");

            migrationBuilder.DropTable(
                name: "StripeConnectWebhookEvents");
        }
    }
}
