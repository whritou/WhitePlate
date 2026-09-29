using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class StaffInvitationConfiguration : IEntityTypeConfiguration<StaffInvitation>
{
    public void Configure(EntityTypeBuilder<StaffInvitation> builder)
    {
        builder.ToTable("StaffInvitations");
        builder.HasKey(invitation => invitation.Id);
        builder.Property(invitation => invitation.Id).ValueGeneratedNever();
        builder.Property(invitation => invitation.Role).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(invitation => invitation.RecipientEmail).HasMaxLength(254);
        builder.Property(invitation => invitation.TokenHash).IsRequired().HasMaxLength(64);
        builder.HasIndex(invitation => invitation.TokenHash).IsUnique();
        builder.Property(invitation => invitation.ExpiresAt).IsRequired();
        builder.Property(invitation => invitation.AcceptedIssuer).HasMaxLength(ExternalIdentity.MaxIssuerLength);
        builder.Property(invitation => invitation.AcceptedSubject).HasMaxLength(ExternalIdentity.MaxSubjectLength)
            .IsConcurrencyToken();
        builder.HasOne<Organization>().WithMany().HasForeignKey(invitation => invitation.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Tenant>().WithMany()
            .HasPrincipalKey(tenant => new { tenant.OrganizationId, Id = tenant.Id })
            .HasForeignKey(invitation => new { invitation.OrganizationId, Id = invitation.TenantId })
            .OnDelete(DeleteBehavior.Restrict);
    }
}
