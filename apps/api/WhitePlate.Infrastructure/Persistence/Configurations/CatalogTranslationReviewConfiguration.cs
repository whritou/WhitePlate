using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class CatalogTranslationReviewConfiguration : IEntityTypeConfiguration<CatalogTranslationReview>
{
    public void Configure(EntityTypeBuilder<CatalogTranslationReview> builder)
    {
        builder.ToTable("CatalogTranslationReviews");
        builder.HasKey(review => review.Id);
        builder.Property(review => review.Id).ValueGeneratedNever();
        builder.Property(review => review.TenantId).IsRequired();
        builder.Property(review => review.EntityType).HasMaxLength(32).IsRequired();
        builder.Property(review => review.Locale).HasMaxLength(128).IsRequired();
        builder.Property(review => review.Name).HasMaxLength(160).IsRequired();
        builder.Property(review => review.Description).HasMaxLength(1000);
        builder.Property(review => review.SourceFingerprint).HasMaxLength(CatalogTranslationReview.MaxFingerprintLength).IsRequired();
        builder.Property(review => review.SavedTranslationFingerprint).HasMaxLength(CatalogTranslationReview.MaxFingerprintLength).IsRequired();
        builder.Property(review => review.Version).IsRequired();
        builder.Property(review => review.Status).HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(review => review.AuthorIssuer).HasMaxLength(ExternalIdentity.MaxIssuerLength).IsRequired();
        builder.Property(review => review.AuthorSubject).HasMaxLength(ExternalIdentity.MaxSubjectLength).IsRequired();
        builder.Property(review => review.CreatedAt).IsRequired();
        builder.Property(review => review.ReviewerIssuer).HasMaxLength(ExternalIdentity.MaxIssuerLength);
        builder.Property(review => review.ReviewerSubject).HasMaxLength(ExternalIdentity.MaxSubjectLength);
        builder.HasOne<Tenant>().WithMany().HasForeignKey(review => review.TenantId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(review => new { review.TenantId, review.EntityType, review.EntityId, review.Locale, review.Version })
            .IsUnique();
        builder.HasIndex(review => new { review.TenantId, review.Status, review.CreatedAt });
    }
}
