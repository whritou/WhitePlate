using WhitePlate.Domain.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Catalog;

public sealed record CatalogTranslationDraftSubmission(CatalogTranslationReview? Review, bool Unchanged);

public enum CatalogTranslationDecisionOutcome
{
    Succeeded,
    NotFound,
    Conflict,
    Stale,
    SelfReviewNotAllowed
}

public sealed record CatalogTranslationReviewEntry(CatalogTranslationReview Review, string SourceName,
    string? SourceDescription, IReadOnlyList<string> GlossaryWarnings);

public sealed record CatalogTranslationSubmissionDto(bool Unchanged, Guid? ReviewId, int? Version, string Status);

public sealed record CatalogTranslationReviewDto(Guid Id, string EntityType, Guid EntityId, string Locale,
    string Name, string? Description, string SourceName, string? SourceDescription, int Version, string Status,
    bool CanReview, IReadOnlyList<string> GlossaryWarnings, DateTimeOffset CreatedAt);

public sealed record CatalogTranslationGlossaryTermDto(Guid Id, string SourceLocale, string TargetLocale,
    string SourceTerm, string TargetTerm, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public interface ICatalogTranslationWorkflowRepository
{
    Task<CatalogTranslationDraftSubmission?> SubmitAsync(Guid tenantId, string entityType, Guid entityId,
        string locale, string name, string? description, ExternalIdentity author, CancellationToken cancellationToken);

    Task<IReadOnlyList<CatalogTranslationReviewEntry>> GetLatestReviewsAsync(Guid tenantId,
        CancellationToken cancellationToken);

    Task<CatalogTranslationDecisionOutcome> DecideAsync(Guid tenantId, Guid reviewId, int expectedVersion,
        bool approve, ExternalIdentity reviewer, bool allowAuthorReview, CancellationToken cancellationToken);

    Task<IReadOnlyList<CatalogTranslationGlossaryTerm>> GetGlossaryAsync(Guid tenantId, string? sourceLocale,
        string? targetLocale, CancellationToken cancellationToken);

    Task<CatalogTranslationGlossaryTerm?> SaveGlossaryTermAsync(Guid tenantId, Guid? id, string sourceLocale,
        string targetLocale, string sourceTerm, string targetTerm, CancellationToken cancellationToken);

    Task<bool> DeleteGlossaryTermAsync(Guid tenantId, Guid id, CancellationToken cancellationToken);
}

public sealed class CatalogTranslationWorkflowHandler(IStaffMembershipRepository memberships,
    ICatalogTranslationWorkflowRepository workflow)
{
    public async Task<Result<CatalogTranslationSubmissionDto>> SubmitAsync(Guid tenantId, string entityType,
        Guid entityId, string locale, string name, string? description, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(tenantId, identity, cancellationToken))
            return Result<CatalogTranslationSubmissionDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var submission = await workflow.SubmitAsync(tenantId, entityType, entityId, locale, name, description,
                identity, cancellationToken);
            if (submission is null)
                return Result<CatalogTranslationSubmissionDto>.Failure(new ApplicationError(ErrorCode.NotFound));
            return Result<CatalogTranslationSubmissionDto>.Success(new CatalogTranslationSubmissionDto(
                submission.Unchanged, submission.Review?.Id, submission.Review?.Version,
                submission.Review?.Status.ToString() ?? "Unchanged"));
        }
        catch (DomainRuleException exception)
        {
            return ValidationFailure<CatalogTranslationSubmissionDto>(exception);
        }
    }

    public async Task<Result<IReadOnlyList<CatalogTranslationReviewDto>>> GetLatestReviewsAsync(Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        var canReview = await CanSelfReviewAsync(tenantId, identity, cancellationToken);
        if (!canReview)
            return Result<IReadOnlyList<CatalogTranslationReviewDto>>.Failure(new ApplicationError(ErrorCode.NotFound));
        var entries = await workflow.GetLatestReviewsAsync(tenantId, cancellationToken);
        IReadOnlyList<CatalogTranslationReviewDto> result = entries.Select(entry => new CatalogTranslationReviewDto(
            entry.Review.Id, entry.Review.EntityType, entry.Review.EntityId, entry.Review.Locale,
            entry.Review.Name, entry.Review.Description, entry.SourceName, entry.SourceDescription,
            entry.Review.Version, entry.Review.Status.ToString(), canReview,
            entry.GlossaryWarnings, entry.Review.CreatedAt)).ToArray();
        return Result<IReadOnlyList<CatalogTranslationReviewDto>>.Success(result);
    }

    public async Task<Result<bool>> DecideAsync(Guid tenantId, Guid reviewId, int expectedVersion, bool approve,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        var canSelfReview = await CanSelfReviewAsync(tenantId, identity, cancellationToken);
        if (!canSelfReview)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (expectedVersion < 1)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("expectedVersion", "invalid_value", "A positive review version is required.")));
        var result = await workflow.DecideAsync(tenantId, reviewId, expectedVersion, approve, identity,
            allowAuthorReview: canSelfReview, cancellationToken);
        return result switch
        {
            CatalogTranslationDecisionOutcome.Succeeded => Result<bool>.Success(true),
            CatalogTranslationDecisionOutcome.NotFound => Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound)),
            CatalogTranslationDecisionOutcome.SelfReviewNotAllowed => Result<bool>.Failure(
                new ApplicationError(ErrorCode.Forbidden)),
            CatalogTranslationDecisionOutcome.Conflict => Result<bool>.Failure(new ApplicationError(ErrorCode.Conflict,
                new ValidationIssue("review", "translation_review_conflict",
                    "This translation review has changed. Refresh and try again."))),
            CatalogTranslationDecisionOutcome.Stale => Result<bool>.Failure(new ApplicationError(ErrorCode.Conflict,
                new ValidationIssue("review", "stale_translation_review",
                    "The source or saved translation changed. Submit a new translation for review."))),
            _ => throw new ArgumentOutOfRangeException(nameof(result))
        };
    }

    public async Task<Result<IReadOnlyList<CatalogTranslationGlossaryTermDto>>> GetGlossaryAsync(Guid tenantId,
        ExternalIdentity identity, string? sourceLocale, string? targetLocale,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(tenantId, identity, cancellationToken))
            return Result<IReadOnlyList<CatalogTranslationGlossaryTermDto>>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var terms = await workflow.GetGlossaryAsync(tenantId, sourceLocale, targetLocale, cancellationToken);
            IReadOnlyList<CatalogTranslationGlossaryTermDto> result = terms.Select(ToDto).ToArray();
            return Result<IReadOnlyList<CatalogTranslationGlossaryTermDto>>.Success(result);
        }
        catch (DomainRuleException exception)
        {
            return ValidationFailure<IReadOnlyList<CatalogTranslationGlossaryTermDto>>(exception);
        }
    }

    public async Task<Result<CatalogTranslationGlossaryTermDto>> SaveGlossaryTermAsync(Guid tenantId, Guid? id,
        string sourceLocale, string targetLocale, string sourceTerm, string targetTerm, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(tenantId, identity, cancellationToken))
            return Result<CatalogTranslationGlossaryTermDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var term = await workflow.SaveGlossaryTermAsync(tenantId, id, sourceLocale, targetLocale, sourceTerm,
                targetTerm, cancellationToken);
            return term is null
                ? Result<CatalogTranslationGlossaryTermDto>.Failure(new ApplicationError(ErrorCode.NotFound))
                : Result<CatalogTranslationGlossaryTermDto>.Success(ToDto(term));
        }
        catch (DomainRuleException exception)
        {
            return ValidationFailure<CatalogTranslationGlossaryTermDto>(exception);
        }
    }

    public async Task<Result<bool>> DeleteGlossaryTermAsync(Guid tenantId, Guid id, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(tenantId, identity, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        var deleted = await workflow.DeleteGlossaryTermAsync(tenantId, id, cancellationToken);
        return deleted ? Result<bool>.Success(true) : Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
    }

    private Task<bool> CanManageAsync(Guid tenantId, ExternalIdentity identity, CancellationToken cancellationToken) =>
        CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken);

    private Task<bool> CanSelfReviewAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.CatalogManage, cancellationToken);

    private static CatalogTranslationGlossaryTermDto ToDto(CatalogTranslationGlossaryTerm term) =>
        new(term.Id, term.SourceLocale, term.TargetLocale, term.SourceTerm, term.TargetTerm,
            term.CreatedAt, term.UpdatedAt);

    private static Result<T> ValidationFailure<T>(DomainRuleException exception) =>
        Result<T>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
            new ValidationIssue(exception.Field, exception.Code, exception.Message)));
}
