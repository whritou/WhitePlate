using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class OrganizationOwnerMembershipConfiguration : IEntityTypeConfiguration<OrganizationOwnerMembership>
{
    public void Configure(EntityTypeBuilder<OrganizationOwnerMembership> builder)
    {
        builder.ToTable("OrganizationOwnerMemberships");
        builder.HasKey(membership => new { membership.OrganizationId, membership.Issuer, membership.Subject });
        builder.Property(membership => membership.Issuer).IsRequired().HasMaxLength(500);
        builder.Property(membership => membership.Subject).IsRequired().HasMaxLength(200);
        builder.HasOne<Organization>().WithMany().HasForeignKey(membership => membership.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
