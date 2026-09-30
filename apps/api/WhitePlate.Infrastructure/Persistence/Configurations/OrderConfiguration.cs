using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(order => order.Id);
        builder.Property(order => order.Id).ValueGeneratedNever();
        builder.Property(order => order.TenantId).IsRequired();
        builder.Property(order => order.Currency).HasMaxLength(3).IsRequired();
        builder.Property(order => order.CustomerName).HasMaxLength(160).IsRequired();
        builder.Property(order => order.DiscountCode).HasMaxLength(32);
        builder.Property(order => order.Subtotal).HasPrecision(12, 2);
        builder.Property(order => order.DiscountAmount).HasPrecision(12, 2);
        builder.Property(order => order.TaxAmount).HasPrecision(12, 2);
        builder.Property(order => order.Total).HasPrecision(12, 2);
        builder.Property(order => order.Status).HasConversion<string>().HasMaxLength(16);
        builder.Property(order => order.Version).IsConcurrencyToken();
        builder.Property(order => order.CreatedAt).IsRequired();
        builder.Property(order => order.CreatedAtTicks).IsRequired();
        builder.HasMany(order => order.Lines).WithOne().HasForeignKey(line => line.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(order => new { order.TenantId, order.CreatedAt, order.Id });
        builder.HasIndex(order => new { order.TenantId, order.CreatedAtTicks, order.Id });
    }
}

public sealed class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.ToTable("OrderLines"); builder.HasKey(line => line.Id);
        builder.Property(line => line.Id).ValueGeneratedNever();
        builder.Property(line => line.ProductName).HasMaxLength(160).IsRequired();
        builder.Property(line => line.BaseUnitPrice).HasPrecision(12, 2);
        builder.Property(line => line.TaxRatePercent).HasPrecision(5, 2);
        builder.Property(line => line.Subtotal).HasPrecision(12, 2);
        builder.Property(line => line.DiscountAmount).HasPrecision(12, 2);
        builder.Property(line => line.TaxAmount).HasPrecision(12, 2);
        builder.Property(line => line.Total).HasPrecision(12, 2);
        builder.HasMany(line => line.Options).WithOne().HasForeignKey(option => option.OrderLineId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class OrderLineOptionConfiguration : IEntityTypeConfiguration<OrderLineOption>
{
    public void Configure(EntityTypeBuilder<OrderLineOption> builder)
    {
        builder.ToTable("OrderLineOptions"); builder.HasKey(option => option.Id);
        builder.Property(option => option.Id).ValueGeneratedNever();
        builder.Property(option => option.Name).HasMaxLength(120).IsRequired();
        builder.Property(option => option.PriceAdjustment).HasPrecision(12, 2);
    }
}
