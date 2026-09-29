using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class ProductOptionGroupConfiguration : IEntityTypeConfiguration<ProductOptionGroup>
{
    public void Configure(EntityTypeBuilder<ProductOptionGroup> builder)
    {
        builder.ToTable("ProductOptionGroups");
        builder.HasKey(group => group.Id);
        builder.Property(group => group.Id).ValueGeneratedNever();
        builder.Property(group => group.TenantId).IsRequired();
        builder.Property(group => group.ProductId).IsRequired();
        builder.Property(group => group.Name).IsRequired().HasMaxLength(120);
        builder.Property(group => group.MinimumSelections).IsRequired();
        builder.Property(group => group.MaximumSelections).IsRequired();
        builder.Property(group => group.SortOrder).IsRequired();
        builder.Property(group => group.IsArchived).IsRequired();
        builder.HasAlternateKey(group => new { group.TenantId, group.Id });
        builder.HasOne<Product>().WithMany()
            .HasPrincipalKey(product => new { product.TenantId, product.Id })
            .HasForeignKey(group => new { group.TenantId, group.ProductId })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
