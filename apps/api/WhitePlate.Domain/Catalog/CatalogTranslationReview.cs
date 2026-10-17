using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Domain.Catalog;

public enum CatalogTranslationReviewStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    Stale = 4,
    Superseded = 5
}

public sealed class CatalogTranslationReview
{
    public const int MaxFingerprintLength = 64;

    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string EntityType { get; private set; } = null!;
    public Guid EntityId { get; private set; }
    public string Locale { get; private set; } = null!;
    public string Name { get; private set; } = null!;
    public string? Description { get; private set; }
    public string SourceFingerprint { get; private set; } = null!;
    public string SavedTranslationFingerprint { get; private set; } = null!;
    public int Version { get; private set; }
    public CatalogTranslationReviewStatus Status { get; private set; }
    public string AuthorIssuer { get; private set; } = null!;
    public string AuthorSubject { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }
    public string? ReviewerIssuer { get; private set; }
    public string? ReviewerSubject { get; private set; }
    public DateTimeOffset? ReviewedAt { get; private set; }

    private CatalogTranslationReview() { }

    public static CatalogTranslationReview Create(Guid tenantId, string entityType, Guid entityId, string locale,
        string name, string? description, string sourceFingerprint, string savedTranslationFingerprint, int version,
        ExternalIdentity author, DateTimeOffset createdAt)
    {
        ArgumentNullException.ThrowIfNull(author);
        if (tenantId == Guid.Empty) Invalid("tenantId", "A restaurant is required.");
        if (entityId == Guid.Empty) Invalid("entityId", "A catalog item is required.");
        if (entityType is not ("categories" or "products" or "option-groups" or "options"))
            Invalid("entityType", "The catalog item type is invalid.");
        if (!MenuLocale.TryCreate(locale, out var normalizedLocale))
            Invalid("locale", "Use a valid menu language tag.");
        if (string.IsNullOrWhiteSpace(name)) Invalid("name", "A translated name is required.");
        var normalizedName = name.Trim();
        var maxNameLength = entityType == "products" ? 160 : 120;
        if (normalizedName.Length > maxNameLength) Invalid("name", "The translated name is too long.");
        var normalizedDescription = description?.Trim();
        if (entityType != "products" && !string.IsNullOrEmpty(normalizedDescription))
            Invalid("description", "Only products support translated descriptions.");
        if (normalizedDescription?.Length > 1000) Invalid("description", "The translated description is too long.");
        ValidateFingerprint(sourceFingerprint, "sourceFingerprint");
        ValidateFingerprint(savedTranslationFingerprint, "savedTranslationFingerprint");
        if (version < 1) Invalid("version", "A positive review version is required.");

        return new CatalogTranslationReview
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            EntityType = entityType,
            EntityId = entityId,
            Locale = normalizedLocale!.Value,
            Name = normalizedName,
            Description = string.IsNullOrEmpty(normalizedDescription) ? null : normalizedDescription,
            SourceFingerprint = sourceFingerprint,
            SavedTranslationFingerprint = savedTranslationFingerprint,
            Version = version,
            Status = CatalogTranslationReviewStatus.Pending,
            AuthorIssuer = author.Issuer,
            AuthorSubject = author.Subject,
            CreatedAt = createdAt
        };
    }

    public void Approve(ExternalIdentity reviewer, int expectedVersion, DateTimeOffset reviewedAt,
        bool allowAuthorReview = false)
    {
        EnsureReviewable(reviewer, expectedVersion, allowAuthorReview);
        Status = CatalogTranslationReviewStatus.Approved;
        SetReviewer(reviewer, reviewedAt);
    }

    public void Reject(ExternalIdentity reviewer, int expectedVersion, DateTimeOffset reviewedAt,
        bool allowAuthorReview = false)
    {
        EnsureReviewable(reviewer, expectedVersion, allowAuthorReview);
        Status = CatalogTranslationReviewStatus.Rejected;
        SetReviewer(reviewer, reviewedAt);
    }

    public void MarkStale(ExternalIdentity reviewer, DateTimeOffset reviewedAt)
    {
        ArgumentNullException.ThrowIfNull(reviewer);
        if (Status != CatalogTranslationReviewStatus.Pending)
            throw new DomainRuleException("translation_review_conflict", "review", "This review is no longer pending.");
        Status = CatalogTranslationReviewStatus.Stale;
        SetReviewer(reviewer, reviewedAt);
    }

    public void Supersede()
    {
        if (Status == CatalogTranslationReviewStatus.Pending)
            Status = CatalogTranslationReviewStatus.Superseded;
    }

    private void EnsureReviewable(ExternalIdentity reviewer, int expectedVersion, bool allowAuthorReview)
    {
        ArgumentNullException.ThrowIfNull(reviewer);
        if (Version != expectedVersion || Status != CatalogTranslationReviewStatus.Pending)
            throw new DomainRuleException("translation_review_conflict", "version",
                "This translation review has changed. Refresh and try again.");
        if (!allowAuthorReview && string.Equals(AuthorIssuer, reviewer.Issuer, StringComparison.Ordinal) &&
            string.Equals(AuthorSubject, reviewer.Subject, StringComparison.Ordinal))
            throw new DomainRuleException("self_review_not_allowed", "reviewer",
                "A translation author cannot review their own change.");
    }

    private void SetReviewer(ExternalIdentity reviewer, DateTimeOffset reviewedAt)
    {
        ReviewerIssuer = reviewer.Issuer;
        ReviewerSubject = reviewer.Subject;
        ReviewedAt = reviewedAt;
    }

    private static void ValidateFingerprint(string value, string field)
    {
        if (value.Length != MaxFingerprintLength || value.Any(character => !Uri.IsHexDigit(character)))
            Invalid(field, "A SHA-256 fingerprint is required.");
    }

    private static void Invalid(string field, string message) =>
        throw new DomainRuleException("invalid_translation_review", field, message);
}
