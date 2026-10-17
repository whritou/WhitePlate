using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class StripeConnectConnectionConfiguration : IEntityTypeConfiguration<StripeConnectConnectionRecord>
{
    public void Configure(EntityTypeBuilder<StripeConnectConnectionRecord> builder)
    {
        builder.ToTable("StripeConnectConnections");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).ValueGeneratedNever();
        builder.Property(row => row.TenantId).IsRequired();
        builder.HasOne<WhitePlate.Domain.Tenants.Tenant>().WithMany()
            .HasForeignKey(row => row.TenantId).OnDelete(DeleteBehavior.Restrict);
        builder.Property(row => row.Mode).IsRequired();
        builder.Property(row => row.StripeAccountId).IsRequired().HasMaxLength(255);
        builder.Property(row => row.ConnectionState).IsRequired();
        builder.Property(row => row.ReadinessState).IsRequired();
        builder.Property(row => row.CardPaymentsCapabilityStatus).HasMaxLength(32);
        builder.Property(row => row.CurrentlyDueCount).IsRequired();
        builder.Property(row => row.PastDueCount).IsRequired();
        builder.Property(row => row.PendingVerificationCount).IsRequired();
        builder.Property(row => row.DetailsSubmitted).IsRequired();
        builder.Property(row => row.ChargesEnabled).IsRequired();
        builder.Property(row => row.PayoutsEnabled).IsRequired();
        builder.Property(row => row.ConnectedAt).IsRequired();
        builder.Property(row => row.UpdatedAt).IsRequired();
        builder.HasIndex(row => new { row.TenantId, row.Mode }).IsUnique()
            .HasDatabaseName("UX_StripeConnectConnections_Tenant_Mode");
        builder.HasIndex(row => new { row.Mode, row.StripeAccountId }).IsUnique()
            .HasDatabaseName("UX_StripeConnectConnections_Mode_Account");
    }
}
