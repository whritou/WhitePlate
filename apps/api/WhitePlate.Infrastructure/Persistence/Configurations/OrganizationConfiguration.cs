using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.ToTable("Organizations");
        builder.HasKey(organization => organization.Id);
        builder.Property(organization => organization.Id).ValueGeneratedNever();
        builder.Property(organization => organization.Name).IsRequired().HasMaxLength(Organization.MaxNameLength);
        builder.Property(organization => organization.IsActive).IsRequired();
        builder.Property(organization => organization.LegalCountryCode).HasMaxLength(2);
        builder.Property(organization => organization.LegalName).HasMaxLength(200);
        builder.Property(organization => organization.LegalRegistrationNumber).HasMaxLength(32);
        builder.Property(organization => organization.TaxIdentifier).HasMaxLength(32);
        builder.Property(organization => organization.LegalProfileVersion).IsRequired().HasDefaultValue(1)
            .IsConcurrencyToken();
    }
}
