using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CustomOrganizationRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_RestaurantMemberships",
                table: "RestaurantMemberships");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrganizationRoleGrants",
                table: "OrganizationRoleGrants");

            migrationBuilder.AddColumn<string>(
                name: "RoleId",
                table: "StaffInvitations",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "Id",
                table: "RestaurantMemberships",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "OrganizationId",
                table: "RestaurantMemberships",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RoleId",
                table: "RestaurantMemberships",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RoleId",
                table: "OrganizationRoleGrants",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "OrganizationRoleGrants",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "OrganizationRoleGrants",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NormalizedName",
                table: "OrganizationRoleGrants",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "OrganizationRoleGrants"
                SET "RoleId" = "Role",
                    "Name" = CASE "Role" WHEN 'Kitchen' THEN 'Kitchen staff' ELSE "Role" END,
                    "NormalizedName" = upper(CASE "Role" WHEN 'Kitchen' THEN 'Kitchen staff' ELSE "Role" END),
                    "IsArchived" = FALSE;

                UPDATE "RestaurantMemberships" AS membership
                SET "Id" = gen_random_uuid(),
                    "OrganizationId" = tenant."OrganizationId",
                    "RoleId" = membership."Role"
                FROM "Tenants" AS tenant
                WHERE tenant."Id" = membership."TenantId";

                UPDATE "StaffInvitations"
                SET "RoleId" = CASE "Role"
                    WHEN 'OrganizationOwner' THEN NULL
                    WHEN 'RestaurantManager' THEN 'Manager'
                    WHEN 'KitchenStaff' THEN 'Kitchen'
                    WHEN 'RestaurantStaff' THEN 'Staff'
                    WHEN 'Accountant' THEN 'Accountant'
                    ELSE NULL
                END;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "Id",
                table: "RestaurantMemberships",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RoleId",
                table: "RestaurantMemberships",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RoleId",
                table: "OrganizationRoleGrants",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(80)",
                oldMaxLength: 80,
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsArchived",
                table: "OrganizationRoleGrants",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "OrganizationRoleGrants",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "NormalizedName",
                table: "OrganizationRoleGrants",
                type: "character varying(60)",
                maxLength: 60,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(60)",
                oldMaxLength: 60,
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_RestaurantMemberships",
                table: "RestaurantMemberships",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrganizationRoleGrants",
                table: "OrganizationRoleGrants",
                columns: new[] { "OrganizationId", "RoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_StaffInvitations_OrganizationId_RoleId",
                table: "StaffInvitations",
                columns: new[] { "OrganizationId", "RoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantMemberships_OrganizationId_RoleId",
                table: "RestaurantMemberships",
                columns: new[] { "OrganizationId", "RoleId" });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantMemberships_OrganizationId_TenantId",
                table: "RestaurantMemberships",
                columns: new[] { "OrganizationId", "TenantId" });

            migrationBuilder.CreateIndex(
                name: "IX_RestaurantMemberships_TenantId_Issuer_Subject",
                table: "RestaurantMemberships",
                columns: new[] { "TenantId", "Issuer", "Subject" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OrganizationRoleGrants_OrganizationId_NormalizedName",
                table: "OrganizationRoleGrants",
                columns: new[] { "OrganizationId", "NormalizedName" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RestaurantMemberships_OrganizationRoleGrants_OrganizationId~",
                table: "RestaurantMemberships",
                columns: new[] { "OrganizationId", "RoleId" },
                principalTable: "OrganizationRoleGrants",
                principalColumns: new[] { "OrganizationId", "RoleId" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_RestaurantMemberships_Tenants_OrganizationId_TenantId",
                table: "RestaurantMemberships",
                columns: new[] { "OrganizationId", "TenantId" },
                principalTable: "Tenants",
                principalColumns: new[] { "OrganizationId", "Id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffInvitations_OrganizationRoleGrants_OrganizationId_Role~",
                table: "StaffInvitations",
                columns: new[] { "OrganizationId", "RoleId" },
                principalTable: "OrganizationRoleGrants",
                principalColumns: new[] { "OrganizationId", "RoleId" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM "OrganizationRoleGrants"
                        WHERE "RoleId" <> "Role") OR EXISTS (
                        SELECT 1 FROM "RestaurantMemberships"
                        WHERE "RoleId" <> "Role") OR EXISTS (
                        SELECT 1 FROM "StaffInvitations"
                        WHERE ("Role" = 'OrganizationOwner' AND "RoleId" IS NOT NULL)
                           OR ("Role" = 'RestaurantManager' AND "RoleId" IS DISTINCT FROM 'Manager')
                           OR ("Role" = 'KitchenStaff' AND "RoleId" IS DISTINCT FROM 'Kitchen')
                           OR ("Role" = 'RestaurantStaff' AND "RoleId" IS DISTINCT FROM 'Staff')
                           OR ("Role" = 'Accountant' AND "RoleId" IS DISTINCT FROM 'Accountant')
                    ) THEN
                        RAISE EXCEPTION 'Cannot downgrade custom organization roles while custom role data exists.';
                    END IF;
                END $$;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_RestaurantMemberships_OrganizationRoleGrants_OrganizationId~",
                table: "RestaurantMemberships");

            migrationBuilder.DropForeignKey(
                name: "FK_RestaurantMemberships_Tenants_OrganizationId_TenantId",
                table: "RestaurantMemberships");

            migrationBuilder.DropForeignKey(
                name: "FK_StaffInvitations_OrganizationRoleGrants_OrganizationId_Role~",
                table: "StaffInvitations");

            migrationBuilder.DropIndex(
                name: "IX_StaffInvitations_OrganizationId_RoleId",
                table: "StaffInvitations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_RestaurantMemberships",
                table: "RestaurantMemberships");

            migrationBuilder.DropIndex(
                name: "IX_RestaurantMemberships_OrganizationId_RoleId",
                table: "RestaurantMemberships");

            migrationBuilder.DropIndex(
                name: "IX_RestaurantMemberships_OrganizationId_TenantId",
                table: "RestaurantMemberships");

            migrationBuilder.DropIndex(
                name: "IX_RestaurantMemberships_TenantId_Issuer_Subject",
                table: "RestaurantMemberships");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OrganizationRoleGrants",
                table: "OrganizationRoleGrants");

            migrationBuilder.DropIndex(
                name: "IX_OrganizationRoleGrants_OrganizationId_NormalizedName",
                table: "OrganizationRoleGrants");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "StaffInvitations");

            migrationBuilder.DropColumn(
                name: "Id",
                table: "RestaurantMemberships");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "RestaurantMemberships");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "RestaurantMemberships");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "OrganizationRoleGrants");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "OrganizationRoleGrants");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "OrganizationRoleGrants");

            migrationBuilder.DropColumn(
                name: "NormalizedName",
                table: "OrganizationRoleGrants");

            migrationBuilder.AddPrimaryKey(
                name: "PK_RestaurantMemberships",
                table: "RestaurantMemberships",
                columns: new[] { "TenantId", "Issuer", "Subject" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_OrganizationRoleGrants",
                table: "OrganizationRoleGrants",
                columns: new[] { "OrganizationId", "Role" });
        }
    }
}
