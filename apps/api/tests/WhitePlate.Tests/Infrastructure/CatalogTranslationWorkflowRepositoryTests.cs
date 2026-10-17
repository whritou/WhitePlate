using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Catalog;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class CatalogTranslationWorkflowRepositoryTests
{
    [Fact]
    public async Task SubmittingAChangedTranslationKeepsSavedValueAndPublishedSnapshotUntouchedUntilApproval()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, product) = await SeedCatalogAsync(database);
        var snapshot = "{\"published\":true}";
        database.CatalogPublicationHeads.Add(CatalogPublicationHead.Create(tenant.Id, 1, snapshot,
            DateTimeOffset.UtcNow));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        var repository = new CatalogTranslationWorkflowRepository(database);
        var author = ExternalIdentity.Create("https://identity.example.test", "author");
        var reviewer = ExternalIdentity.Create("https://identity.example.test", "reviewer");

        var submitted = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe nouvelle",
            "Nouvelle description", author, TestContext.Current.CancellationToken);

        Assert.NotNull(submitted);
        Assert.False(submitted.Unchanged);
        Assert.Equal(CatalogTranslationReviewStatus.Pending, submitted.Review!.Status);
        Assert.Equal("Soupe", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Name);
        Assert.Equal(snapshot, await database.CatalogPublicationHeads.Where(head => head.TenantId == tenant.Id)
            .Select(head => head.SnapshotJson).SingleAsync(TestContext.Current.CancellationToken));

        var result = await repository.DecideAsync(tenant.Id, submitted.Review.Id, submitted.Review.Version,
            approve: true, reviewer, allowAuthorReview: false, TestContext.Current.CancellationToken);

        Assert.Equal(CatalogTranslationDecisionOutcome.Succeeded, result);
        Assert.Equal("Soupe nouvelle", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Name);
        Assert.Equal(snapshot, await database.CatalogPublicationHeads.Where(head => head.TenantId == tenant.Id)
            .Select(head => head.SnapshotJson).SingleAsync(TestContext.Current.CancellationToken));
        Assert.Equal(CatalogTranslationReviewStatus.Approved, submitted.Review.Status);
        Assert.Equal(reviewer.Subject, submitted.Review.ReviewerSubject);
    }

    [Fact]
    public async Task SavingAnUnchangedLegacyTranslationDoesNotCreateReviewMetadata()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, product) = await SeedCatalogAsync(database);
        var repository = new CatalogTranslationWorkflowRepository(database);
        var author = ExternalIdentity.Create("https://identity.example.test", "author");

        var submitted = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe",
            "Soupe fraîche", author, TestContext.Current.CancellationToken);

        Assert.NotNull(submitted);
        Assert.True(submitted.Unchanged);
        Assert.Null(submitted.Review);
        Assert.Empty(await database.CatalogTranslationReviews.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task SubmittingANewerCandidateSupersedesThePreviousPendingVersion()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, product) = await SeedCatalogAsync(database);
        var repository = new CatalogTranslationWorkflowRepository(database);
        var author = ExternalIdentity.Create("https://identity.example.test", "author");

        var first = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe un",
            "Description un", author, TestContext.Current.CancellationToken);
        var second = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe deux",
            "Description deux", author, TestContext.Current.CancellationToken);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(1, first.Review!.Version);
        Assert.Equal(CatalogTranslationReviewStatus.Superseded, first.Review.Status);
        Assert.Equal(2, second.Review!.Version);
        Assert.Equal(CatalogTranslationReviewStatus.Pending, second.Review.Status);
        Assert.Equal("Soupe", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Name);
    }

    [Fact]
    public async Task ApprovalMarksCandidateStaleWhenSourceChangesAfterSubmission()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, product) = await SeedCatalogAsync(database);
        var repository = new CatalogTranslationWorkflowRepository(database);
        var author = ExternalIdentity.Create("https://identity.example.test", "author");
        var reviewer = ExternalIdentity.Create("https://identity.example.test", "reviewer");
        var submitted = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe nouvelle",
            "Nouvelle description", author, TestContext.Current.CancellationToken);
        Assert.NotNull(submitted?.Review);

        product.Update("Soup", "New source description", 8m, 10m, 0, true);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var result = await repository.DecideAsync(tenant.Id, submitted.Review.Id, submitted.Review.Version,
            approve: true, reviewer, allowAuthorReview: false, TestContext.Current.CancellationToken);

        Assert.Equal(CatalogTranslationDecisionOutcome.Stale, result);
        Assert.Equal(CatalogTranslationReviewStatus.Stale, submitted.Review.Status);
        Assert.Equal("Soupe", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Name);
    }

    [Fact]
    public async Task RejectingACandidateLeavesTheSavedTranslationUntouched()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, product) = await SeedCatalogAsync(database);
        var repository = new CatalogTranslationWorkflowRepository(database);
        var author = ExternalIdentity.Create("https://identity.example.test", "author");
        var reviewer = ExternalIdentity.Create("https://identity.example.test", "reviewer");
        var submitted = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe candidate",
            "Candidate description", author, TestContext.Current.CancellationToken);
        Assert.NotNull(submitted?.Review);

        var result = await repository.DecideAsync(tenant.Id, submitted.Review.Id, submitted.Review.Version,
            approve: false, reviewer, allowAuthorReview: false, TestContext.Current.CancellationToken);

        Assert.Equal(CatalogTranslationDecisionOutcome.Succeeded, result);
        Assert.Equal(CatalogTranslationReviewStatus.Rejected, submitted.Review.Status);
        Assert.Equal(reviewer.Subject, submitted.Review.ReviewerSubject);
        Assert.Equal("Soupe", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Name);
        Assert.Equal("Soupe fraîche", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Description);
    }

    [Fact]
    public async Task AuthorCannotApproveCandidateAndNoTranslationIsApplied()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, product) = await SeedCatalogAsync(database);
        var repository = new CatalogTranslationWorkflowRepository(database);
        var author = ExternalIdentity.Create("https://identity.example.test", "author");
        var submitted = await repository.SubmitAsync(tenant.Id, "products", product.Id, "fr", "Soupe candidate",
            null, author, TestContext.Current.CancellationToken);
        Assert.NotNull(submitted?.Review);

        var result = await repository.DecideAsync(tenant.Id, submitted.Review.Id, submitted.Review.Version,
            approve: true, author, allowAuthorReview: false, TestContext.Current.CancellationToken);

        Assert.Equal(CatalogTranslationDecisionOutcome.SelfReviewNotAllowed, result);
        Assert.Equal(CatalogTranslationReviewStatus.Pending, submitted.Review.Status);
        Assert.Equal("Soupe", CatalogTranslations.GetAll(product.TranslationsJson)["fr"].Name);
    }

    [Fact]
    public async Task GlossaryEntriesAreTenantScopedAndDuplicateSourceTermsAreRejected()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var (tenant, _) = await SeedCatalogAsync(database);
        var anotherOrganization = Organization.Create("Other Acme");
        database.Organizations.Add(anotherOrganization);
        var otherTenant = Tenant.Create(anotherOrganization.Id, "Other Bistro", "other-bistro", "EUR");
        otherTenant.UpdateMenuLocales(["en", "fr"], "en");
        database.Tenants.Add(otherTenant);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        var repository = new CatalogTranslationWorkflowRepository(database);

        var created = await repository.SaveGlossaryTermAsync(tenant.Id, null, "en", "fr", "sourdough",
            "levain", TestContext.Current.CancellationToken);

        Assert.NotNull(created);
        Assert.Single(await repository.GetGlossaryAsync(tenant.Id, "en", "fr", TestContext.Current.CancellationToken));
        Assert.Empty(await repository.GetGlossaryAsync(otherTenant.Id, null, null, TestContext.Current.CancellationToken));
        var duplicate = await Assert.ThrowsAsync<WhitePlate.Domain.Common.DomainRuleException>(() =>
            repository.SaveGlossaryTermAsync(tenant.Id, null, "en", "fr", "SOURDOUGH", "pain au levain",
                TestContext.Current.CancellationToken));
        Assert.Equal("duplicate_glossary_term", duplicate.Code);
    }

    private static WhitePlateDbContext CreateDatabase(SqliteConnection connection) =>
        new(new DbContextOptionsBuilder<WhitePlateDbContext>().UseSqlite(connection).Options);

    private static async Task<(Tenant Tenant, Product Product)> SeedCatalogAsync(WhitePlateDbContext database)
    {
        var organization = Organization.Create("Acme");
        database.Organizations.Add(organization);
        var tenant = Tenant.Create(organization.Id, "Bistro", "bistro", "EUR");
        tenant.UpdateMenuLocales(["en", "fr"], "en");
        database.Tenants.Add(tenant);
        var category = MenuCategory.Create(tenant.Id, "Mains", 0);
        database.MenuCategories.Add(category);
        var product = Product.Create(tenant.Id, category.Id, "Soup", "Fresh soup", 8m, 10m, 0);
        product.SetTranslation("fr", "Soupe", "Soupe fraîche");
        database.Products.Add(product);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        return (tenant, product);
    }
}
