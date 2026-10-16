using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class CatalogRevisionConfiguration : IEntityTypeConfiguration<CatalogRevision>
{
    public void Configure(EntityTypeBuilder<CatalogRevision> builder)
    {
        builder.ToTable("CatalogRevisions");
        builder.HasKey(revision => new { revision.TenantId, revision.Version });
        builder.Property(revision => revision.TenantId).ValueGeneratedNever();
        builder.Property(revision => revision.Version).ValueGeneratedNever();
        builder.Property(revision => revision.SnapshotJson).HasColumnType("jsonb").IsRequired();
        builder.Property(revision => revision.ChangeSetJson).HasColumnType("jsonb").IsRequired();
        builder.Property(revision => revision.Action).HasMaxLength(16).IsRequired();
        builder.Property(revision => revision.ActorIssuer).HasMaxLength(ExternalIdentity.MaxIssuerLength).IsRequired();
        builder.Property(revision => revision.ActorSubject).HasMaxLength(ExternalIdentity.MaxSubjectLength).IsRequired();
        builder.Property(revision => revision.PublishedAt).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(revision => revision.TenantId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(revision => new { revision.TenantId, revision.PublishedAt });
    }
}
