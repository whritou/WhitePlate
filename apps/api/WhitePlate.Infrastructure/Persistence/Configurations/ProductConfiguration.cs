using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(product => product.Id);
        builder.Property(product => product.Id).ValueGeneratedNever();
        builder.Property(product => product.TenantId).IsRequired();
        builder.Property(product => product.CategoryId).IsRequired();
        builder.Property(product => product.Name).IsRequired().HasMaxLength(Product.MaxNameLength);
        builder.Property(product => product.Description).HasMaxLength(Product.MaxDescriptionLength);
        builder.Property(product => product.BasePrice).HasPrecision(12, 2).IsRequired();
        builder.Property(product => product.TaxRatePercent).HasPrecision(5, 2).IsRequired();
        builder.Property(product => product.SortOrder).IsRequired();
        builder.Property(product => product.IsAvailable).IsRequired();
        builder.Property(product => product.IsArchived).IsRequired();
        builder.HasAlternateKey(product => new { product.TenantId, product.Id });
        builder.HasOne<MenuCategory>().WithMany()
            .HasPrincipalKey(category => new { category.TenantId, category.Id })
            .HasForeignKey(product => new { product.TenantId, product.CategoryId })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(product => new { product.TenantId, product.CategoryId, product.SortOrder, product.Id });
    }
}
