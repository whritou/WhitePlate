using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Configurations;

public sealed class CatalogTranslationGlossaryTermConfiguration : IEntityTypeConfiguration<CatalogTranslationGlossaryTerm>
{
    public void Configure(EntityTypeBuilder<CatalogTranslationGlossaryTerm> builder)
    {
        builder.ToTable("CatalogTranslationGlossaryTerms");
        builder.HasKey(term => term.Id);
        builder.Property(term => term.Id).ValueGeneratedNever();
        builder.Property(term => term.TenantId).IsRequired();
        builder.Property(term => term.SourceLocale).HasMaxLength(128).IsRequired();
        builder.Property(term => term.TargetLocale).HasMaxLength(128).IsRequired();
        builder.Property(term => term.SourceTerm).HasMaxLength(120).IsRequired();
        builder.Property(term => term.SourceTermKey).HasMaxLength(256).IsRequired();
        builder.Property(term => term.TargetTerm).HasMaxLength(120).IsRequired();
        builder.Property(term => term.CreatedAt).IsRequired();
        builder.Property(term => term.UpdatedAt).IsRequired();
        builder.HasOne<Tenant>().WithMany().HasForeignKey(term => term.TenantId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(term => new { term.TenantId, term.SourceLocale, term.TargetLocale, term.SourceTermKey })
            .IsUnique();
    }
}
