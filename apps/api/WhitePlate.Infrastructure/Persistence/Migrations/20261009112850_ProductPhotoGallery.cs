using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WhitePlate.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProductPhotoGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MediaAssets_TenantId_Slot",
                table: "MediaAssets");

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "MediaAssets",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "MediaAssets",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_TenantId_ProductId_IsActive_SortOrder",
                table: "MediaAssets",
                columns: new[] { "TenantId", "ProductId", "IsActive", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_TenantId_Slot",
                table: "MediaAssets",
                columns: new[] { "TenantId", "Slot" },
                unique: true,
                filter: "\"IsActive\" = true AND \"ProductId\" IS NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_MediaAssets_Products_TenantId_ProductId",
                table: "MediaAssets",
                columns: new[] { "TenantId", "ProductId" },
                principalTable: "Products",
                principalColumns: new[] { "TenantId", "Id" },
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MediaAssets_Products_TenantId_ProductId",
                table: "MediaAssets");

            migrationBuilder.DropIndex(
                name: "IX_MediaAssets_TenantId_ProductId_IsActive_SortOrder",
                table: "MediaAssets");

            migrationBuilder.DropIndex(
                name: "IX_MediaAssets_TenantId_Slot",
                table: "MediaAssets");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "MediaAssets");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "MediaAssets");

            migrationBuilder.CreateIndex(
                name: "IX_MediaAssets_TenantId_Slot",
                table: "MediaAssets",
                columns: new[] { "TenantId", "Slot" },
                unique: true,
                filter: "\"IsActive\" = true");
        }
    }
}
