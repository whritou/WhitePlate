using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class OrganizationRoleGrantSetConfiguration : IEntityTypeConfiguration<OrganizationRoleGrantSet>
{
    public void Configure(EntityTypeBuilder<OrganizationRoleGrantSet> builder)
    {
        builder.ToTable("OrganizationRoleGrants");
        builder.HasKey(grant => new { grant.OrganizationId, grant.RoleId });
        builder.Property(grant => grant.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(grant => grant.RoleId).HasMaxLength(80).IsRequired();
        builder.Property(grant => grant.Name).HasMaxLength(60).IsRequired();
        builder.Property(grant => grant.NormalizedName).HasMaxLength(60).IsRequired();
        builder.Property(grant => grant.IsArchived).IsRequired();
        builder.HasIndex(grant => new { grant.OrganizationId, grant.NormalizedName }).IsUnique();
        builder.Property(grant => grant.Permissions).HasConversion<long>().IsRequired();
        builder.Property(grant => grant.Version).IsConcurrencyToken().IsRequired();
        builder.HasOne<Organization>().WithMany().HasForeignKey(grant => grant.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
