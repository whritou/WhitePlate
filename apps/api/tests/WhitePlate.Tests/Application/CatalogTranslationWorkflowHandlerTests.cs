using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class CatalogTranslationWorkflowHandlerTests
{
    [Fact]
    public async Task KitchenRoleCannotSubmitTranslationCandidate()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test", "kitchen");
        var repository = new TranslationWorkflowRepositoryStub();
        var handler = new CatalogTranslationWorkflowHandler(
            new MembershipStub(tenantId, identity, RestaurantRole.Kitchen), repository);

        var result = await handler.SubmitAsync(tenantId, "products", Guid.NewGuid(), "fr", "Soupe", null,
            identity, TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
        Assert.Equal(0, repository.Submissions);
    }

    [Fact]
    public async Task ManagerCanDecideTheirOwnTranslationCandidate()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test", "manager");
        var repository = new TranslationWorkflowRepositoryStub();
        var handler = new CatalogTranslationWorkflowHandler(
            new MembershipStub(tenantId, identity, RestaurantRole.Manager), repository);

        var result = await handler.DecideAsync(tenantId, Guid.NewGuid(), 1, approve: true, identity,
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal(1, repository.Decisions);
        Assert.True(repository.AllowAuthorReview);
    }

    [Fact]
    public async Task KitchenRoleCannotDecideTranslationCandidate()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test", "kitchen");
        var repository = new TranslationWorkflowRepositoryStub();
        var handler = new CatalogTranslationWorkflowHandler(
            new MembershipStub(tenantId, identity, RestaurantRole.Kitchen), repository);

        var result = await handler.DecideAsync(tenantId, Guid.NewGuid(), 1, approve: true, identity,
            TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
        Assert.Equal(0, repository.Decisions);
    }

    private sealed class TranslationWorkflowRepositoryStub : ICatalogTranslationWorkflowRepository
    {
        public int Submissions { get; private set; }
        public int Decisions { get; private set; }
        public bool AllowAuthorReview { get; private set; }
        public CatalogTranslationDecisionOutcome Decision { get; init; } = CatalogTranslationDecisionOutcome.Succeeded;

        public Task<CatalogTranslationDraftSubmission?> SubmitAsync(Guid tenantId, string entityType, Guid entityId,
            string locale, string name, string? description, ExternalIdentity author, CancellationToken cancellationToken)
        {
            Submissions++;
            return Task.FromResult<CatalogTranslationDraftSubmission?>(new(null, false));
        }

        public Task<IReadOnlyList<CatalogTranslationReviewEntry>> GetLatestReviewsAsync(Guid tenantId,
            CancellationToken cancellationToken) => Task.FromResult<IReadOnlyList<CatalogTranslationReviewEntry>>([]);

        public Task<CatalogTranslationDecisionOutcome> DecideAsync(Guid tenantId, Guid reviewId, int expectedVersion,
            bool approve, ExternalIdentity reviewer, bool allowAuthorReview, CancellationToken cancellationToken)
        {
            Decisions++;
            AllowAuthorReview = allowAuthorReview;
            return Task.FromResult(Decision);
        }

        public Task<IReadOnlyList<CatalogTranslationGlossaryTerm>> GetGlossaryAsync(Guid tenantId,
            string? sourceLocale, string? targetLocale, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<CatalogTranslationGlossaryTerm>>([]);

        public Task<CatalogTranslationGlossaryTerm?> SaveGlossaryTermAsync(Guid tenantId, Guid? id,
            string sourceLocale, string targetLocale, string sourceTerm, string targetTerm,
            CancellationToken cancellationToken) => Task.FromResult<CatalogTranslationGlossaryTerm?>(null);

        public Task<bool> DeleteGlossaryTermAsync(Guid tenantId, Guid id, CancellationToken cancellationToken) =>
            Task.FromResult(false);
    }

    private sealed class MembershipStub(Guid tenantId, ExternalIdentity identity, RestaurantRole role)
        : IStaffMembershipRepository
    {
        public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity candidate,
            CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid candidateTenantId, ExternalIdentity candidate,
            CancellationToken cancellationToken) => Task.FromResult(false);

        public Task<bool> HasRestaurantRoleAsync(Guid candidateTenantId, ExternalIdentity candidate,
            RestaurantRole requestedRole, CancellationToken cancellationToken) => Task.FromResult(
            candidateTenantId == tenantId && candidate == identity && requestedRole == role);
        public Task<bool> HasPermissionAsync(Guid candidateTenantId, ExternalIdentity candidate, WhitePlate.Domain.Organizations.RestaurantPermission permission, CancellationToken cancellationToken) => Task.FromResult(candidateTenantId == tenantId && candidate == identity && role == RestaurantRole.Manager && permission != WhitePlate.Domain.Organizations.RestaurantPermission.BillingManage);
    }
}
