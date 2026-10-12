using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LegalProfileSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LegalCountryCode",
                table: "Tenants",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                table: "Tenants",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalProfileMode",
                table: "Tenants",
                type: "character varying(8)",
                maxLength: 8,
                nullable: false,
                defaultValue: "inherit");

            migrationBuilder.AddColumn<int>(
                name: "LegalProfileVersion",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "LegalRegistrationNumber",
                table: "Tenants",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxIdentifier",
                table: "Tenants",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalCountryCode",
                table: "Organizations",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                table: "Organizations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LegalProfileVersion",
                table: "Organizations",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "LegalRegistrationNumber",
                table: "Organizations",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxIdentifier",
                table: "Organizations",
                type: "character varying(32)",
                maxLength: 32,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LegalCountryCode",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LegalName",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LegalProfileMode",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LegalProfileVersion",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LegalRegistrationNumber",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TaxIdentifier",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "LegalCountryCode",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LegalName",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LegalProfileVersion",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "LegalRegistrationNumber",
                table: "Organizations");

            migrationBuilder.DropColumn(
                name: "TaxIdentifier",
                table: "Organizations");
        }
    }
}
