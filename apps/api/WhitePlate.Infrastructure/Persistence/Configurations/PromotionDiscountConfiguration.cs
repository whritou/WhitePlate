using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class PromotionDiscountConfiguration : IEntityTypeConfiguration<PromotionDiscount>
{
    public void Configure(EntityTypeBuilder<PromotionDiscount> builder)
    {
        builder.ToTable("PromotionDiscounts");
        builder.HasKey(discount => discount.Id);
        builder.Property(discount => discount.Id).ValueGeneratedNever();
        builder.Property(discount => discount.TenantId).IsRequired();
        builder.Property(discount => discount.Code).IsRequired().HasMaxLength(32);
        builder.Property(discount => discount.Name).IsRequired().HasMaxLength(120);
        builder.Property(discount => discount.Kind).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(discount => discount.Value).HasPrecision(12, 2).IsRequired();
        builder.Property(discount => discount.IsActive).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(discount => discount.TenantId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(discount => new { discount.TenantId, discount.Code }).IsUnique();
    }
}
