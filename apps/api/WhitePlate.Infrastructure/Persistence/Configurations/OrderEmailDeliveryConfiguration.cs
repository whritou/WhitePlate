using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class OrderEmailDeliveryConfiguration : IEntityTypeConfiguration<OrderEmailDelivery>
{
    public void Configure(EntityTypeBuilder<OrderEmailDelivery> builder)
    {
        builder.ToTable("OrderEmailDeliveries");
        builder.HasKey(delivery => delivery.Id);
        builder.Property(delivery => delivery.Id).ValueGeneratedNever();
        builder.Property(delivery => delivery.TenantId).IsRequired();
        builder.Property(delivery => delivery.OrderId).IsRequired();
        builder.Property(delivery => delivery.EventType).HasMaxLength(64).IsRequired();
        builder.Property(delivery => delivery.RecipientEmail).HasMaxLength(254);
        builder.Property(delivery => delivery.Status).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(delivery => delivery.AttemptCount).IsRequired();
        builder.Property(delivery => delivery.CreatedAt).IsRequired();
        builder.Property(delivery => delivery.NextAttemptAt).IsRequired();
        builder.Property(delivery => delivery.ProviderMessageId).HasMaxLength(200);
        builder.Property(delivery => delivery.LastFailureCode).HasMaxLength(64);
        builder.Property(delivery => delivery.SubjectSnapshot).HasColumnType("text");
        builder.Property(delivery => delivery.HtmlSnapshot).HasColumnType("text");
        builder.Property(delivery => delivery.TextSnapshot).HasColumnType("text");
        builder.HasOne<WhitePlate.Domain.Orders.Order>().WithMany().HasForeignKey(delivery => delivery.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(delivery => new { delivery.Status, delivery.NextAttemptAt, delivery.LeaseUntil });
        builder.HasIndex(delivery => new { delivery.TenantId, delivery.OrderId, delivery.CreatedAt });
    }
}
