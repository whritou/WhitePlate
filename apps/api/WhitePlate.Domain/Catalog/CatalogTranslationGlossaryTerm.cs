using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;
using System.Text;

namespace WhitePlate.Domain.Catalog;

public sealed class CatalogTranslationGlossaryTerm
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string SourceLocale { get; private set; } = null!;
    public string TargetLocale { get; private set; } = null!;
    public string SourceTerm { get; private set; } = null!;
    public string SourceTermKey { get; private set; } = null!;
    public string TargetTerm { get; private set; } = null!;
    public DateTimeOffset CreatedAt { get; private set; }
    public DateTimeOffset UpdatedAt { get; private set; }

    private CatalogTranslationGlossaryTerm() { }

    public static CatalogTranslationGlossaryTerm Create(Guid tenantId, string sourceLocale, string targetLocale,
        string sourceTerm, string targetTerm, DateTimeOffset? now = null)
    {
        if (tenantId == Guid.Empty) Invalid("tenantId", "A restaurant is required.");
        if (string.IsNullOrWhiteSpace(sourceTerm)) Invalid("sourceTerm", "A source term is required.");
        if (string.IsNullOrWhiteSpace(targetTerm)) Invalid("targetTerm", "A target term is required.");
        var normalizedSource = sourceTerm.Trim();
        var normalizedTarget = targetTerm.Trim();
        if (normalizedSource.Length > 120) Invalid("sourceTerm", "The source term is too long.");
        if (normalizedTarget.Length > 120) Invalid("targetTerm", "The target term is too long.");
        var source = MenuLocale.Create(sourceLocale).Value;
        var target = MenuLocale.Create(targetLocale).Value;
        var timestamp = now ?? DateTimeOffset.UtcNow;

        return new CatalogTranslationGlossaryTerm
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SourceLocale = source,
            TargetLocale = target,
            SourceTerm = normalizedSource,
            SourceTermKey = NormalizeTermKey(normalizedSource),
            TargetTerm = normalizedTarget,
            CreatedAt = timestamp,
            UpdatedAt = timestamp
        };
    }

    public void Update(string sourceLocale, string targetLocale, string sourceTerm, string targetTerm,
        DateTimeOffset? now = null)
    {
        var replacement = Create(TenantId, sourceLocale, targetLocale, sourceTerm, targetTerm, now);
        SourceLocale = replacement.SourceLocale;
        TargetLocale = replacement.TargetLocale;
        SourceTerm = replacement.SourceTerm;
        SourceTermKey = replacement.SourceTermKey;
        TargetTerm = replacement.TargetTerm;
        UpdatedAt = replacement.UpdatedAt;
    }

    private static void Invalid(string field, string message) =>
        throw new DomainRuleException("invalid_glossary_term", field, message);

    private static string NormalizeTermKey(string value) => value.Normalize(NormalizationForm.FormKC).ToLowerInvariant();
}

public static class CatalogTranslationGlossaryValidation
{
    public static IReadOnlyList<string> FindMismatches(string? sourceName, string? targetName,
        string? sourceDescription, string? targetDescription,
        IReadOnlyList<CatalogTranslationGlossaryTerm> terms)
    {
        ArgumentNullException.ThrowIfNull(terms);
        return terms.Where(term =>
                Contains(sourceName, term.SourceTerm) && !Contains(targetName, term.TargetTerm) ||
                Contains(sourceDescription, term.SourceTerm) && !Contains(targetDescription, term.TargetTerm))
            .Select(term => term.SourceTerm)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(term => term, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static bool Contains(string? text, string term) =>
        !string.IsNullOrEmpty(text) && text.Contains(term, StringComparison.OrdinalIgnoreCase);
}
