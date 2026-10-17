using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class StripeConnectOAuthStateConfiguration : IEntityTypeConfiguration<StripeConnectOAuthStateRecord>
{
    public void Configure(EntityTypeBuilder<StripeConnectOAuthStateRecord> builder)
    {
        builder.ToTable("StripeConnectOAuthStates");
        builder.HasKey(row => row.Id);
        builder.Property(row => row.Id).ValueGeneratedNever();
        builder.Property(row => row.StateHash).IsRequired().HasMaxLength(64);
        builder.HasIndex(row => row.StateHash).IsUnique().HasDatabaseName("UX_StripeConnectOAuthStates_StateHash");
        builder.Property(row => row.TenantId).IsRequired();
        builder.HasOne<WhitePlate.Domain.Tenants.Tenant>().WithMany()
            .HasForeignKey(row => row.TenantId).OnDelete(DeleteBehavior.Restrict);
        builder.Property(row => row.OwnerIssuer).IsRequired().HasMaxLength(500);
        builder.Property(row => row.OwnerSubject).IsRequired().HasMaxLength(200);
        builder.Property(row => row.Mode).IsRequired();
        builder.Property(row => row.Locale).IsRequired().HasMaxLength(2);
        builder.Property(row => row.CreatedAt).IsRequired();
        builder.Property(row => row.ExpiresAt).IsRequired();
        builder.HasIndex(row => new { row.ExpiresAt, row.ConsumedAt })
            .HasDatabaseName("IX_StripeConnectOAuthStates_Expiry_Consumed");
    }
}
