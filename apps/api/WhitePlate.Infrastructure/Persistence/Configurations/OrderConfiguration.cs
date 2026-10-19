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
        builder.Property(order => order.CustomerEmail).HasMaxLength(254);
        builder.Property(order => order.CustomerPhone).HasMaxLength(40);
        builder.Property(order => order.OrderNotes).HasMaxLength(500);
        builder.Property(order => order.EmailTrackingTokenHash).HasMaxLength(64);
        builder.Property(order => order.AnalyticsSource).HasMaxLength(8);
        builder.Property(order => order.AnalyticsConsentedAt);
        builder.Property(order => order.AnalyticsReturningCustomer).HasDefaultValue(false).IsRequired();
        builder.Property(order => order.MenuLocale).HasMaxLength(128);
        builder.Property(order => order.DiscountCode).HasMaxLength(32);
        builder.Property(order => order.Subtotal).HasPrecision(12, 2);
        builder.Property(order => order.DiscountAmount).HasPrecision(12, 2);
        builder.Property(order => order.TaxAmount).HasPrecision(12, 2);
        builder.Property(order => order.Total).HasPrecision(12, 2);
        builder.Property(order => order.Status).HasConversion<string>().HasMaxLength(16);
        builder.Property(order => order.CancellationReason).HasConversion<string>().HasMaxLength(40);
        builder.Property(order => order.Version).IsConcurrencyToken();
        builder.Property(order => order.CreatedAt).IsRequired();
        builder.Property(order => order.CreatedAtTicks).IsRequired();
        builder.Property(order => order.PickupAt);
        builder.Property(order => order.PickupAtTicks);
        builder.Property(order => order.PickupTimeZone).HasMaxLength(100);
        builder.Property(order => order.PickupMode).HasConversion<string>().HasMaxLength(16);
        builder.Property(order => order.PreparingAt);
        builder.Property(order => order.PreparingAtTicks);
        builder.Property(order => order.ReadyAt);
        builder.Property(order => order.ReadyAtTicks);
        builder.Property(order => order.ClosedAt);
        builder.Property(order => order.ClosedAtTicks);
        builder.Property(order => order.ArchivedAt);
        builder.Property(order => order.TrackingTokenHash).HasMaxLength(64);
        builder.Property(order => order.TrackingTokenExpiresAt);
        builder.HasMany(order => order.Lines).WithOne().HasForeignKey(line => line.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(order => order.AnalyticsFingerprints).WithOne().HasForeignKey(fingerprint => fingerprint.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(order => order.AnalyticsRepeatLinks).WithOne().HasForeignKey(link => link.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(order => new { order.TenantId, order.CreatedAt, order.Id });
        builder.HasIndex(order => new { order.TenantId, order.CreatedAtTicks, order.Id });
        builder.HasIndex(order => new { order.TenantId, order.Status });
        builder.HasIndex(order => new { order.TenantId, order.ReadyAtTicks });
        builder.HasIndex(order => new { order.Status, order.ClosedAtTicks, order.ArchivedAt });
    }
}

public sealed class OrderAnalyticsFingerprintConfiguration : IEntityTypeConfiguration<OrderAnalyticsFingerprint>
{
    public void Configure(EntityTypeBuilder<OrderAnalyticsFingerprint> builder)
    {
        builder.ToTable("OrderAnalyticsFingerprints");
        builder.HasKey(fingerprint => new { fingerprint.TenantId, fingerprint.OrderId, fingerprint.KeyVersion });
        builder.Property(fingerprint => fingerprint.KeyVersion).HasMaxLength(32).IsRequired();
        builder.Property(fingerprint => fingerprint.FingerprintHash).HasMaxLength(64).IsRequired();
        builder.Property(fingerprint => fingerprint.ExpiresAt).IsRequired();
        builder.HasIndex(fingerprint => new
        {
            fingerprint.TenantId,
            fingerprint.KeyVersion,
            fingerprint.FingerprintHash
        });
        builder.HasIndex(fingerprint => fingerprint.ExpiresAt);
    }
}

public sealed class OrderAnalyticsRepeatLinkConfiguration : IEntityTypeConfiguration<OrderAnalyticsRepeatLink>
{
    public void Configure(EntityTypeBuilder<OrderAnalyticsRepeatLink> builder)
    {
        builder.ToTable("OrderAnalyticsRepeatLinks");
        builder.HasKey(link => new { link.TenantId, link.OrderId, link.PriorOrderId });
        builder.Property(link => link.TenantId).IsRequired();
        builder.Property(link => link.OrderId).IsRequired();
        builder.Property(link => link.PriorOrderId).IsRequired();
        builder.Property(link => link.ExpiresAt).IsRequired();
        builder.HasOne<Order>().WithMany().HasForeignKey(link => link.PriorOrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(link => new { link.TenantId, link.PriorOrderId, link.ExpiresAt });
        builder.HasIndex(link => link.ExpiresAt);
    }
}

public sealed class OrderLineConfiguration : IEntityTypeConfiguration<OrderLine>
{
    public void Configure(EntityTypeBuilder<OrderLine> builder)
    {
        builder.ToTable("OrderLines"); builder.HasKey(line => line.Id);
        builder.Property(line => line.Id).ValueGeneratedNever();
        builder.Property(line => line.ProductName).HasMaxLength(160).IsRequired();
        builder.Property(line => line.ContainsAllergensJson).IsRequired();
        builder.Property(line => line.MayContainAllergensJson).IsRequired();
        builder.Property(line => line.DietaryTagsJson).IsRequired();
        builder.Property(line => line.PreparationNotesJson).IsRequired();
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
