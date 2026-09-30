using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable("OrderOutboxMessages");
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Id).ValueGeneratedNever();
        builder.Property(message => message.TenantId).IsRequired();
        builder.Property(message => message.EventType).HasMaxLength(64).IsRequired();
        builder.Property(message => message.PayloadJson).HasColumnType("text").IsRequired();
        builder.Property(message => message.OccurredAt).IsRequired();
        builder.Property(message => message.AvailableAt).IsRequired();
        builder.Property(message => message.LeaseVersion).IsConcurrencyToken();
        builder.Property(message => message.Attempts).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(message => message.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(message => new { message.DispatchedAt, message.AvailableAt, message.LeaseUntil });
        builder.HasIndex(message => new { message.TenantId, message.OccurredAt, message.Id });
    }
}
