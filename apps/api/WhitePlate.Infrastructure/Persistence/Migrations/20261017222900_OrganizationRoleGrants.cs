using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    public partial class OrganizationRoleGrants : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "OrganizationRoleGrants",
                columns: table => new
                {
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Permissions = table.Column<long>(type: "bigint", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrganizationRoleGrants", x => new { x.OrganizationId, x.Role });
                    table.ForeignKey(
                        name: "FK_OrganizationRoleGrants_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql("""
                INSERT INTO "OrganizationRoleGrants" ("OrganizationId", "Role", "Permissions", "Version")
                SELECT organization."Id", defaults."Role", defaults."Permissions", 1
                FROM "Organizations" AS organization
                CROSS JOIN (VALUES
                    ('Manager', 127::bigint),
                    ('Staff', 3::bigint),
                    ('Kitchen', 2::bigint),
                    ('Accountant', 144::bigint)
                ) AS defaults("Role", "Permissions");
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder) =>
            migrationBuilder.DropTable(name: "OrganizationRoleGrants");
    }
}
