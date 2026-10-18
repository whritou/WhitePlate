using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class RestaurantMembershipConfiguration : IEntityTypeConfiguration<RestaurantMembership>
{
    public void Configure(EntityTypeBuilder<RestaurantMembership> builder)
    {
        builder.ToTable("RestaurantMemberships");
        builder.HasKey(membership => membership.Id);
        builder.Property(membership => membership.Id).ValueGeneratedNever();
        builder.Property(membership => membership.OrganizationId);
        builder.Property(membership => membership.RoleId).HasMaxLength(80).IsRequired();
        builder.Property(membership => membership.Issuer).IsRequired().HasMaxLength(500);
        builder.Property(membership => membership.Subject).IsRequired().HasMaxLength(200);
        builder.Property(membership => membership.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.HasIndex(membership => new { membership.TenantId, membership.Issuer, membership.Subject }).IsUnique();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(membership => membership.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Tenant>().WithMany()
            .HasPrincipalKey(tenant => new { tenant.OrganizationId, Id = tenant.Id })
            .HasForeignKey(membership => new { membership.OrganizationId, Id = membership.TenantId })
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<WhitePlate.Domain.Organizations.OrganizationRoleGrantSet>().WithMany()
            .HasForeignKey(membership => new { membership.OrganizationId, membership.RoleId })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
