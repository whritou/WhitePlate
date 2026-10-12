using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class PickupSlotUsageConfiguration : IEntityTypeConfiguration<PickupSlotUsage>
{
    public void Configure(EntityTypeBuilder<PickupSlotUsage> builder)
    {
        builder.ToTable("PickupSlotUsages");
        builder.HasKey(usage => new { usage.TenantId, usage.SlotStartTicks });
        builder.Property(usage => usage.TenantId).ValueGeneratedNever();
        builder.Property(usage => usage.SlotStartTicks).ValueGeneratedNever();
        builder.Property(usage => usage.ReservedCount).IsRequired();
        builder.HasOne<WhitePlate.Domain.Tenants.Tenant>().WithMany()
            .HasForeignKey(usage => usage.TenantId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class PickupSlotReservationConfiguration : IEntityTypeConfiguration<PickupSlotReservation>
{
    public void Configure(EntityTypeBuilder<PickupSlotReservation> builder)
    {
        builder.ToTable("PickupSlotReservations");
        builder.HasKey(reservation => reservation.OrderId);
        builder.Property(reservation => reservation.OrderId).ValueGeneratedNever();
        builder.Property(reservation => reservation.TenantId).IsRequired();
        builder.Property(reservation => reservation.SlotStartTicks).IsRequired();
        builder.Property(reservation => reservation.ReleasedAt);
        builder.HasOne<WhitePlate.Domain.Orders.Order>().WithOne()
            .HasForeignKey<PickupSlotReservation>(reservation => reservation.OrderId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(reservation => new { reservation.TenantId, reservation.SlotStartTicks, reservation.ReleasedAt });
    }
}
