using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class StripeConnectWebhookEventConfiguration : IEntityTypeConfiguration<StripeConnectWebhookEventRecord>
{
    public void Configure(EntityTypeBuilder<StripeConnectWebhookEventRecord> builder)
    {
        builder.ToTable("StripeConnectWebhookEvents");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).ValueGeneratedNever();
        builder.Property(row => row.Mode).IsRequired();
        builder.Property(row => row.EventId).IsRequired().HasMaxLength(255);
        builder.Property(row => row.EventType).IsRequired().HasMaxLength(100);
        builder.Property(row => row.StripeAccountId).HasMaxLength(255);
        builder.Property(row => row.EventCreatedAt).IsRequired();
        builder.Property(row => row.ReceivedAt).IsRequired();
        builder.HasIndex(row => new { row.Mode, row.EventId }).IsUnique()
            .HasDatabaseName("UX_StripeConnectWebhookEvents_Mode_Event");
        builder.HasIndex(row => new { row.Mode, row.StripeAccountId, row.EventCreatedAt })
            .HasDatabaseName("IX_StripeConnectWebhookEvents_Mode_Account_Created");
    }
}
