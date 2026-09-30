using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class IdempotencyRecordConfiguration : IEntityTypeConfiguration<IdempotencyRecord>
{
    public void Configure(EntityTypeBuilder<IdempotencyRecord> builder)
    {
        builder.ToTable("OrderIdempotencyRecords");
        builder.HasKey(record => record.Id);
        builder.Property(record => record.Id).ValueGeneratedNever();
        builder.Property(record => record.TenantId).IsRequired();
        builder.Property(record => record.KeyHash).HasMaxLength(64).IsRequired();
        builder.Property(record => record.RequestHash).HasMaxLength(64).IsRequired();
        builder.Property(record => record.ResponseJson).HasColumnType("text").IsRequired();
        builder.Property(record => record.ExpiresAt).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(record => record.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(record => new { record.TenantId, record.KeyHash }).IsUnique();
        builder.HasIndex(record => record.ExpiresAt);
    }
}
