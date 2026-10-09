using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Media;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class MediaAssetConfiguration : IEntityTypeConfiguration<MediaAsset>
{
    public void Configure(EntityTypeBuilder<MediaAsset> builder)
    {
        builder.ToTable("MediaAssets");
        builder.HasKey(asset => asset.Id);
        builder.Property(asset => asset.Id).ValueGeneratedNever();
        builder.Property(asset => asset.Slot).HasMaxLength(16).IsRequired();
        builder.Property(asset => asset.ContentType).HasMaxLength(32).IsRequired();
        builder.Property(asset => asset.ObjectKey).HasMaxLength(128).IsRequired();
        builder.Property(asset => asset.CreatedAt).HasConversion(value => value.UtcDateTime, value => new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc)));
        builder.Property(asset => asset.ExpiresAt).HasConversion(value => value.HasValue ? value.Value.UtcDateTime : (DateTime?)null,
            value => value.HasValue ? new DateTimeOffset(DateTime.SpecifyKind(value.Value, DateTimeKind.Utc)) : (DateTimeOffset?)null);
        builder.HasOne<Tenant>().WithMany().HasForeignKey(asset => asset.TenantId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(asset => asset.ObjectKey).IsUnique();
        builder.HasIndex(asset => new { asset.TenantId, asset.Slot }).IsUnique().HasFilter("\"IsActive\" = true");
        builder.HasIndex(asset => asset.ExpiresAt);
    }
}
