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
        builder.Property(tenant => tenant.DefaultMenuLocale).IsRequired().HasMaxLength(128);
        builder.Property(tenant => tenant.MenuLocalesJson).IsRequired();
        builder.Property(tenant => tenant.DescriptionTranslationsJson).IsRequired().HasDefaultValue("{}");
        builder.Property(tenant => tenant.Phone).HasMaxLength(40);
        builder.Property(tenant => tenant.AddressLine1).HasMaxLength(200);
        builder.Property(tenant => tenant.AddressLine2).HasMaxLength(200);
        builder.Property(tenant => tenant.PostalCode).HasMaxLength(20);
        builder.Property(tenant => tenant.City).HasMaxLength(100);
        builder.Property(tenant => tenant.Region).HasMaxLength(100);
        builder.Property(tenant => tenant.CountryCode).HasMaxLength(2);
        builder.Property(tenant => tenant.Latitude).HasPrecision(9, 6);
        builder.Property(tenant => tenant.Longitude).HasPrecision(9, 6);
        builder.Property(tenant => tenant.TimeZone).HasMaxLength(100).IsRequired().HasDefaultValue("UTC");
        builder.Property(tenant => tenant.PickupInstructionsJson).IsRequired().HasDefaultValue("{}");
        builder.Property(tenant => tenant.OpeningHoursJson).HasColumnType("jsonb");
        builder.Property(tenant => tenant.EstablishmentVersion).IsRequired().HasDefaultValue(1);
        builder.HasIndex(tenant => tenant.Subdomain).IsUnique().HasDatabaseName(SubdomainIndex);
        builder.Property(tenant => tenant.IsActive).IsRequired();
        builder.Property(tenant => tenant.LegalProfileMode).HasMaxLength(8).IsRequired().HasDefaultValue("inherit");
        builder.Property(tenant => tenant.LegalCountryCode).HasMaxLength(2);
        builder.Property(tenant => tenant.LegalName).HasMaxLength(200);
        builder.Property(tenant => tenant.LegalRegistrationNumber).HasMaxLength(32);
        builder.Property(tenant => tenant.TaxIdentifier).HasMaxLength(32);
        builder.Property(tenant => tenant.LegalProfileVersion).IsRequired().HasDefaultValue(1);
    }
}
