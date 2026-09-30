using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class ProductOptionConfiguration : IEntityTypeConfiguration<ProductOption>
{
    public void Configure(EntityTypeBuilder<ProductOption> builder)
    {
        builder.ToTable("ProductOptions");
        builder.HasKey(option => option.Id);
        builder.Property(option => option.Id).ValueGeneratedNever();
        builder.Property(option => option.TenantId).IsRequired();
        builder.Property(option => option.GroupId).IsRequired();
        builder.Property(option => option.Name).IsRequired().HasMaxLength(120);
        builder.Property(option => option.PriceAdjustment).HasPrecision(12, 2).IsRequired();
        builder.Property(option => option.SortOrder).IsRequired();
        builder.Property(option => option.IsArchived).IsRequired();
        builder.HasOne<ProductOptionGroup>().WithMany()
            .HasPrincipalKey(group => new { group.TenantId, group.Id })
            .HasForeignKey(option => new { option.TenantId, option.GroupId })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
