using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Tests.Domain;

public sealed class CatalogTranslationReviewTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 17, 12, 0, 0, TimeSpan.Zero);
    private static readonly string Fingerprint = new('a', 64);

    [Fact]
    public void AuthorCannotApproveTheirOwnTranslationChange()
    {
        var author = ExternalIdentity.Create("https://identity.example.test", "manager-1");
        var review = CreateReview(author);

        var exception = Assert.Throws<DomainRuleException>(() => review.Approve(author, 1, Now.AddMinutes(1)));

        Assert.Equal("self_review_not_allowed", exception.Code);
        Assert.Equal(CatalogTranslationReviewStatus.Pending, review.Status);
        Assert.Null(review.ReviewerSubject);
    }

    [Fact]
    public void DifferentManagerCanApproveTheCurrentPendingVersion()
    {
        var author = ExternalIdentity.Create("https://identity.example.test", "manager-1");
        var reviewer = ExternalIdentity.Create("https://identity.example.test", "manager-2");
        var review = CreateReview(author);
        var reviewedAt = Now.AddMinutes(1);

        review.Approve(reviewer, 1, reviewedAt);

        Assert.Equal(CatalogTranslationReviewStatus.Approved, review.Status);
        Assert.Equal(reviewer.Issuer, review.ReviewerIssuer);
        Assert.Equal(reviewer.Subject, review.ReviewerSubject);
        Assert.Equal(reviewedAt, review.ReviewedAt);
    }

    [Fact]
    public void GlossaryValidationFlagsOnlySourceTermsMissingTheirTargetTerm()
    {
        var tenantId = Guid.NewGuid();
        var term = CatalogTranslationGlossaryTerm.Create(tenantId, "en", "fr", "crème brûlée",
            "crème brûlée");

        var warnings = CatalogTranslationGlossaryValidation.FindMismatches(
            "Crème brûlée is served warm.", "Dessert servi chaud.", null, null, [term]);

        Assert.Equal(["crème brûlée"], warnings);
        Assert.Empty(CatalogTranslationGlossaryValidation.FindMismatches(
            "Crème brûlée is served warm.", "Crème brûlée servi chaud.", null, null, [term]));
        Assert.Empty(CatalogTranslationGlossaryValidation.FindMismatches(
            "Chocolate cake.", "Gâteau au chocolat.", null, null, [term]));
    }

    private static CatalogTranslationReview CreateReview(ExternalIdentity author) =>
        CatalogTranslationReview.Create(Guid.NewGuid(), "products", Guid.NewGuid(), "fr", "Soupe",
            "Description", Fingerprint, Fingerprint, 1, author, Now);
}
