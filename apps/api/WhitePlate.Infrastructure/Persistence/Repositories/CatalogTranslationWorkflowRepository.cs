using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Catalog;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class CatalogTranslationWorkflowRepository(WhitePlateDbContext database)
    : ICatalogTranslationWorkflowRepository
{
    public async Task<CatalogTranslationDraftSubmission?> SubmitAsync(Guid tenantId, string entityType, Guid entityId,
        string locale, string name, string? description, ExternalIdentity author, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var tenant = await database.Tenants.SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);
        if (tenant is null) return null;
        var normalizedLocale = MenuLocale.Create(locale).Value;
        if (!tenant.SupportsMenuLocale(normalizedLocale))
            throw new DomainRuleException("unsupported_menu_locale", "locale",
                "Enable this language in the restaurant menu settings before submitting a translation.");

        var item = await LoadItemAsync(tenantId, entityType, entityId, cancellationToken,
            locale: normalizedLocale);
        if (item is null) return null;
        var normalizedName = name.Trim();
        var normalizedDescription = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        var matchingReviews = await database.CatalogTranslationReviews
            .Where(review => review.TenantId == tenantId && review.EntityType == entityType &&
                review.EntityId == entityId && review.Locale == normalizedLocale)
            .OrderByDescending(review => review.Version)
            .ToListAsync(cancellationToken);
        var latest = matchingReviews.FirstOrDefault();
        if (item.SavedTranslation is { } saved && saved.Name == normalizedName &&
            saved.Description == normalizedDescription)
        {
            foreach (var pending in matchingReviews.Where(review => review.Status == CatalogTranslationReviewStatus.Pending))
                pending.Supersede();
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return new CatalogTranslationDraftSubmission(null, true);
        }

        if (latest is { Status: CatalogTranslationReviewStatus.Pending } && latest.Name == normalizedName &&
            latest.Description == normalizedDescription)
        {
            await transaction.CommitAsync(cancellationToken);
            return new CatalogTranslationDraftSubmission(latest, false);
        }

        foreach (var pending in matchingReviews.Where(review => review.Status == CatalogTranslationReviewStatus.Pending))
            pending.Supersede();
        if (latest?.Version == int.MaxValue)
            throw new DomainRuleException("translation_review_version_exhausted", "version",
                "A new review version cannot be created for this catalog item.");
        var review = CatalogTranslationReview.Create(tenantId, entityType, entityId, normalizedLocale,
            normalizedName, normalizedDescription, Fingerprint(item.SourceName, item.SourceDescription),
            Fingerprint(item.SavedTranslation?.Name, item.SavedTranslation?.Description),
            (latest?.Version ?? 0) + 1, author, DateTimeOffset.UtcNow);
        database.CatalogTranslationReviews.Add(review);
        await database.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return new CatalogTranslationDraftSubmission(review, false);
    }

    public async Task<IReadOnlyList<CatalogTranslationReviewEntry>> GetLatestReviewsAsync(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var reviews = await database.CatalogTranslationReviews.AsNoTracking()
            .Where(review => review.TenantId == tenantId)
            .OrderByDescending(review => review.Version)
            .ToListAsync(cancellationToken);
        var sourceLocale = await database.Tenants.AsNoTracking().Where(tenant => tenant.Id == tenantId)
            .Select(tenant => tenant.DefaultMenuLocale).SingleOrDefaultAsync(cancellationToken);
        if (sourceLocale is null) return [];
        var latest = reviews.GroupBy(review => (review.EntityType, review.EntityId, review.Locale))
            .Select(group => group.First()).ToArray();
        var entries = new List<CatalogTranslationReviewEntry>(latest.Length);
        foreach (var review in latest)
        {
            var item = await LoadItemAsync(tenantId, review.EntityType, review.EntityId, cancellationToken,
                noTracking: true, locale: review.Locale);
            if (item is null) continue;
            var terms = await database.CatalogTranslationGlossaryTerms.AsNoTracking()
                .Where(term => term.TenantId == tenantId && term.SourceLocale ==
                    sourceLocale && term.TargetLocale == review.Locale)
                .ToListAsync(cancellationToken);
            var warnings = CatalogTranslationGlossaryValidation.FindMismatches(item.SourceName, review.Name,
                item.SourceDescription, review.Description, terms);
            entries.Add(new CatalogTranslationReviewEntry(review, item.SourceName, item.SourceDescription, warnings));
        }
        return entries.OrderByDescending(entry => entry.Review.CreatedAt).ToArray();
    }

    public async Task<CatalogTranslationDecisionOutcome> DecideAsync(Guid tenantId, Guid reviewId,
        int expectedVersion, bool approve, ExternalIdentity reviewer, CancellationToken cancellationToken)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(cancellationToken);
        var review = await database.CatalogTranslationReviews.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == reviewId, cancellationToken);
        if (review is null) return CatalogTranslationDecisionOutcome.NotFound;
        var item = await LoadItemAsync(tenantId, review.EntityType, review.EntityId, cancellationToken,
            locale: review.Locale);
        if (item is null) return CatalogTranslationDecisionOutcome.NotFound;
        if (review.Status != CatalogTranslationReviewStatus.Pending || review.Version != expectedVersion)
            return CatalogTranslationDecisionOutcome.Conflict;

        if (review.SourceFingerprint != Fingerprint(item.SourceName, item.SourceDescription) ||
            review.SavedTranslationFingerprint != Fingerprint(item.SavedTranslation?.Name,
                item.SavedTranslation?.Description))
        {
            review.MarkStale(reviewer, DateTimeOffset.UtcNow);
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return CatalogTranslationDecisionOutcome.Stale;
        }

        try
        {
            if (approve)
            {
                review.Approve(reviewer, expectedVersion, DateTimeOffset.UtcNow);
                item.ApplyTranslation(review.Locale, review.Name, review.Description);
            }
            else
            {
                review.Reject(reviewer, expectedVersion, DateTimeOffset.UtcNow);
            }
        }
        catch (DomainRuleException exception) when (exception.Code == "self_review_not_allowed")
        {
            return CatalogTranslationDecisionOutcome.SelfReviewNotAllowed;
        }
        catch (DomainRuleException exception) when (exception.Code == "translation_review_conflict")
        {
            return CatalogTranslationDecisionOutcome.Conflict;
        }

        try
        {
            await database.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return CatalogTranslationDecisionOutcome.Succeeded;
        }
        catch (DbUpdateConcurrencyException)
        {
            return CatalogTranslationDecisionOutcome.Conflict;
        }
    }

    public async Task<IReadOnlyList<CatalogTranslationGlossaryTerm>> GetGlossaryAsync(Guid tenantId,
        string? sourceLocale, string? targetLocale, CancellationToken cancellationToken)
    {
        var query = database.CatalogTranslationGlossaryTerms.AsNoTracking().Where(term => term.TenantId == tenantId);
        if (!string.IsNullOrWhiteSpace(sourceLocale))
        {
            var source = MenuLocale.Create(sourceLocale).Value;
            query = query.Where(term => term.SourceLocale == source);
        }
        if (!string.IsNullOrWhiteSpace(targetLocale))
        {
            var target = MenuLocale.Create(targetLocale).Value;
            query = query.Where(term => term.TargetLocale == target);
        }
        return await query.OrderBy(term => term.SourceLocale).ThenBy(term => term.TargetLocale)
            .ThenBy(term => term.SourceTermKey).ToListAsync(cancellationToken);
    }

    public async Task<CatalogTranslationGlossaryTerm?> SaveGlossaryTermAsync(Guid tenantId, Guid? id,
        string sourceLocale, string targetLocale, string sourceTerm, string targetTerm,
        CancellationToken cancellationToken)
    {
        var tenant = await database.Tenants.SingleOrDefaultAsync(item => item.Id == tenantId, cancellationToken);
        if (tenant is null) return null;
        var normalizedSource = MenuLocale.Create(sourceLocale).Value;
        var normalizedTarget = MenuLocale.Create(targetLocale).Value;
        if (!tenant.SupportsMenuLocale(normalizedSource) || !tenant.SupportsMenuLocale(normalizedTarget) ||
            normalizedSource == normalizedTarget)
            throw new DomainRuleException("invalid_glossary_locale_pair", "locale",
                "Choose two different languages enabled for this restaurant.");

        CatalogTranslationGlossaryTerm term;
        if (id is null)
        {
            term = CatalogTranslationGlossaryTerm.Create(tenantId, normalizedSource, normalizedTarget,
                sourceTerm, targetTerm);
            database.CatalogTranslationGlossaryTerms.Add(term);
        }
        else
        {
            term = await database.CatalogTranslationGlossaryTerms.SingleOrDefaultAsync(item =>
                item.TenantId == tenantId && item.Id == id, cancellationToken) ?? null!;
            if (term is null) return null;
            term.Update(normalizedSource, normalizedTarget, sourceTerm, targetTerm);
        }

        var duplicate = await database.CatalogTranslationGlossaryTerms.AnyAsync(item => item.TenantId == tenantId &&
            item.Id != term.Id && item.SourceLocale == term.SourceLocale && item.TargetLocale == term.TargetLocale &&
            item.SourceTermKey == term.SourceTermKey, cancellationToken);
        if (duplicate)
            throw new DomainRuleException("duplicate_glossary_term", "sourceTerm",
                "This source term already exists for the selected language pair.");
        await database.SaveChangesAsync(cancellationToken);
        return term;
    }

    public async Task<bool> DeleteGlossaryTermAsync(Guid tenantId, Guid id, CancellationToken cancellationToken)
    {
        var term = await database.CatalogTranslationGlossaryTerms.SingleOrDefaultAsync(item =>
            item.TenantId == tenantId && item.Id == id, cancellationToken);
        if (term is null) return false;
        database.CatalogTranslationGlossaryTerms.Remove(term);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task<CatalogWorkItem?> LoadItemAsync(Guid tenantId, string entityType, Guid entityId,
        CancellationToken cancellationToken, bool noTracking = false, string? locale = null)
    {
        IQueryable<TEntity> Query<TEntity>(DbSet<TEntity> set) where TEntity : class =>
            noTracking ? set.AsNoTracking() : set;

        switch (entityType)
        {
            case "categories":
            {
                var entity = await Query(database.MenuCategories).SingleOrDefaultAsync(item =>
                    item.TenantId == tenantId && item.Id == entityId && !item.IsArchived, cancellationToken);
                return entity is null ? null : Create(entity.Name, null, entity.TranslationsJson, locale,
                    (localeCode, name, description) => entity.SetTranslation(localeCode, name, description));
            }
            case "products":
            {
                var entity = await Query(database.Products).SingleOrDefaultAsync(item =>
                    item.TenantId == tenantId && item.Id == entityId && !item.IsArchived, cancellationToken);
                return entity is null ? null : Create(entity.Name, entity.Description, entity.TranslationsJson, locale,
                    (localeCode, name, description) => entity.SetTranslation(localeCode, name, description));
            }
            case "option-groups":
            {
                var entity = await Query(database.ProductOptionGroups).SingleOrDefaultAsync(item =>
                    item.TenantId == tenantId && item.Id == entityId && !item.IsArchived, cancellationToken);
                return entity is null ? null : Create(entity.Name, null, entity.TranslationsJson, locale,
                    (localeCode, name, description) => entity.SetTranslation(localeCode, name, description));
            }
            case "options":
            {
                var entity = await Query(database.ProductOptions).SingleOrDefaultAsync(item =>
                    item.TenantId == tenantId && item.Id == entityId && !item.IsArchived, cancellationToken);
                return entity is null ? null : Create(entity.Name, null, entity.TranslationsJson, locale,
                    (localeCode, name, description) => entity.SetTranslation(localeCode, name, description));
            }
            default:
                throw new DomainRuleException("invalid_catalog_entity_type", "entityType",
                    "The catalog item type is invalid.");
        }
    }

    private static CatalogWorkItem Create(string sourceName, string? sourceDescription, string? translationsJson,
        string? locale, Action<string, string, string?> apply)
    {
        var translations = CatalogTranslations.GetAll(translationsJson);
        var item = new CatalogWorkItem(sourceName, sourceDescription, translations, apply);
        if (locale is not null) item.SelectLocale(locale);
        return item;
    }

    private static string Fingerprint(string? name, string? description)
    {
        var value = $"{name?.Trim() ?? ""}\0{description?.Trim() ?? ""}";
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    }

    private sealed class CatalogWorkItem(string sourceName, string? sourceDescription,
        IReadOnlyDictionary<string, CatalogLocalizedText> translations,
        Action<string, string, string?> applyTranslation)
    {
        public string SourceName { get; } = sourceName;
        public string? SourceDescription { get; } = sourceDescription;
        public IReadOnlyDictionary<string, CatalogLocalizedText> Translations { get; } = translations;
        public CatalogLocalizedText? SavedTranslation { get; private set; }
        public Action<string, string, string?> ApplyTranslation { get; } = applyTranslation;

        public void SelectLocale(string locale) => SavedTranslation = Translations.GetValueOrDefault(locale);
    }
}
