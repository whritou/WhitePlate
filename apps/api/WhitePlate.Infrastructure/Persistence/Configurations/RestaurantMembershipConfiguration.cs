using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class RestaurantMembershipConfiguration : IEntityTypeConfiguration<RestaurantMembership>
{
    public void Configure(EntityTypeBuilder<RestaurantMembership> builder)
    {
        builder.ToTable("RestaurantMemberships");
        builder.HasKey(membership => new { membership.TenantId, membership.Issuer, membership.Subject });
        builder.Property(membership => membership.Issuer).IsRequired().HasMaxLength(500);
        builder.Property(membership => membership.Subject).IsRequired().HasMaxLength(200);
        builder.Property(membership => membership.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(membership => membership.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
