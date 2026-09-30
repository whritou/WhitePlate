using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class StaffMembershipsAndInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tenants_OrganizationId",
                table: "Tenants");

            migrationBuilder.AddUniqueConstraint(
                name: "AK_Tenants_OrganizationId_Id",
                table: "Tenants",
                columns: new[] { "OrganizationId", "Id" });

            migrationBuilder.CreateTable(
                name: "OrganizationOwnerMemberships",
                columns: table => new
                {
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Issuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationOwnerMemberships", x => new { x.OrganizationId, x.Issuer, x.Subject });
                    table.ForeignKey(
                        name: "FK_OrganizationOwnerMemberships_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RestaurantMemberships",
                columns: table => new
                {
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Issuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RestaurantMemberships", x => new { x.TenantId, x.Issuer, x.Subject });
                    table.ForeignKey(
                        name: "FK_RestaurantMemberships_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "StaffInvitations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: true),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    TokenHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsRevoked = table.Column<bool>(type: "boolean", nullable: false),
                    AcceptedIssuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AcceptedSubject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffInvitations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StaffInvitations_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StaffInvitations_Tenants_OrganizationId_TenantId",
                        columns: x => new { x.OrganizationId, x.TenantId },
                        principalTable: "Tenants",
                        principalColumns: new[] { "OrganizationId", "Id" },
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StaffInvitations_OrganizationId_TenantId",
                table: "StaffInvitations",
                columns: new[] { "OrganizationId", "TenantId" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffInvitations_TokenHash",
                table: "StaffInvitations",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "OrganizationOwnerMemberships");

            migrationBuilder.DropTable(
                name: "RestaurantMemberships");

            migrationBuilder.DropTable(
                name: "StaffInvitations");

            migrationBuilder.DropUniqueConstraint(
                name: "AK_Tenants_OrganizationId_Id",
                table: "Tenants");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_OrganizationId",
                table: "Tenants",
                column: "OrganizationId");
        }
    }
}
