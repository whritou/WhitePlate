using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public const string SubdomainIndex = "IX_Tenants_Subdomain";

    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");
        builder.HasKey(tenant => tenant.Id);
        builder.Property(tenant => tenant.Id).ValueGeneratedNever();
        builder.Property(tenant => tenant.Name).IsRequired().HasMaxLength(Tenant.MaxNameLength);
        builder.Property(tenant => tenant.OrganizationId).IsRequired();
        builder.HasOne<WhitePlate.Domain.Organizations.Organization>()
            .WithMany().HasForeignKey(tenant => tenant.OrganizationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasAlternateKey(tenant => new { tenant.OrganizationId, tenant.Id });
        builder.Property(tenant => tenant.Subdomain).HasConversion(
            subdomain => subdomain.Value, value => TenantSubdomain.Create(value)).IsRequired().HasMaxLength(63);
        builder.Property(tenant => tenant.Currency).IsRequired().HasMaxLength(3);
        builder.HasIndex(tenant => tenant.Subdomain).IsUnique().HasDatabaseName(SubdomainIndex);
        builder.Property(tenant => tenant.IsActive).IsRequired();
    }
}
