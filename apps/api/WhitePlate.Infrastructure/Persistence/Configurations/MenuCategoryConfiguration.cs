using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class MenuCategoryConfiguration : IEntityTypeConfiguration<MenuCategory>
{
    public void Configure(EntityTypeBuilder<MenuCategory> builder)
    {
        builder.ToTable("MenuCategories");
        builder.HasKey(category => category.Id);
        builder.Property(category => category.Id).ValueGeneratedNever();
        builder.Property(category => category.TenantId).IsRequired();
        builder.Property(category => category.Name).IsRequired().HasMaxLength(MenuCategory.MaxNameLength);
        builder.Property(category => category.SortOrder).IsRequired();
        builder.Property(category => category.IsArchived).IsRequired();
        builder.HasAlternateKey(category => new { category.TenantId, category.Id });
        builder.HasOne<Tenant>().WithMany().HasForeignKey(category => category.TenantId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(category => new { category.TenantId, category.SortOrder, category.Id });
    }
}
