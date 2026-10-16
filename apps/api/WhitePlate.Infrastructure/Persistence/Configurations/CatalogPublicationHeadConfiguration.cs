using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class CatalogPublicationHeadConfiguration : IEntityTypeConfiguration<CatalogPublicationHead>
{
    public void Configure(EntityTypeBuilder<CatalogPublicationHead> builder)
    {
        builder.ToTable("CatalogPublicationHeads");
        builder.HasKey(head => head.TenantId);
        builder.Property(head => head.TenantId).ValueGeneratedNever();
        builder.Property(head => head.PublishedVersion).IsRequired().IsConcurrencyToken();
        builder.Property(head => head.SnapshotJson).HasColumnType("jsonb").IsRequired();
        builder.Property(head => head.UpdatedAt).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(head => head.TenantId).OnDelete(DeleteBehavior.Cascade);
    }
}
