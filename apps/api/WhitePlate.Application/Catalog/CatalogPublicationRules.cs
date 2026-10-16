using System.Text.Json;
using System.Text.Json.Nodes;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Catalog;

public static class CatalogPublicationRules
{
    public static PublishedCatalogSnapshot RemoveDraftOnlyTombstones(PublishedCatalogSnapshot published,
        PublishedCatalogSnapshot draft)
    {
        var publishedCategoryIds = published.Categories.Select(item => item.Id).ToHashSet();
        var categories = draft.Categories.Where(item => !item.IsArchived || publishedCategoryIds.Contains(item.Id))
            .ToArray();
        var categoryIds = categories.Select(item => item.Id).ToHashSet();

        var publishedProductIds = published.Products.Select(item => item.Id).ToHashSet();
        var products = draft.Products.Where(item => (!item.IsArchived || publishedProductIds.Contains(item.Id)) &&
            categoryIds.Contains(item.CategoryId)).ToArray();
        var productIds = products.Select(item => item.Id).ToHashSet();

        var publishedGroupIds = published.OptionGroups.Select(item => item.Id).ToHashSet();
        var groups = draft.OptionGroups.Where(item => (!item.IsArchived || publishedGroupIds.Contains(item.Id)) &&
            productIds.Contains(item.ProductId)).ToArray();
        var groupIds = groups.Select(item => item.Id).ToHashSet();

        var publishedOptionIds = published.Options.Select(item => item.Id).ToHashSet();
        var options = draft.Options.Where(item => (!item.IsArchived || publishedOptionIds.Contains(item.Id)) &&
            groupIds.Contains(item.GroupId)).ToArray();

        var publishedDiscountIds = published.Discounts.Select(item => item.Id).ToHashSet();
        var discounts = draft.Discounts.Where(item => item.IsActive || publishedDiscountIds.Contains(item.Id))
            .ToArray();

        return draft with
        {
            Categories = categories,
            Products = products,
            OptionGroups = groups,
            Options = options,
            Discounts = discounts
        };
    }

    public static IReadOnlyList<ValidationIssue> Validate(PublishedCatalogSnapshot snapshot)
    {
        var issues = new List<ValidationIssue>();
        if (snapshot.TenantId == Guid.Empty)
            issues.Add(Issue("tenantId", "invalid_tenant", "A restaurant is required."));

        var normalizedLocales = new List<string>();
        foreach (var locale in snapshot.Locales)
        {
            if (!MenuLocale.TryCreate(locale, out var parsed))
                issues.Add(Issue("locales", "invalid_locale", "One or more menu languages are invalid."));
            else if (normalizedLocales.Contains(parsed!.Value, StringComparer.OrdinalIgnoreCase))
                issues.Add(Issue("locales", "duplicate_locale", "Menu languages must be unique."));
            else normalizedLocales.Add(parsed!.Value);
        }

        if (normalizedLocales.Count == 0)
            issues.Add(Issue("locales", "required", "At least one menu language is required."));
        if (!normalizedLocales.Contains(snapshot.DefaultLocale, StringComparer.OrdinalIgnoreCase))
            issues.Add(Issue("defaultLocale", "unsupported_default_locale", "The default language must be enabled."));

        var categoryIds = snapshot.Categories.Select(item => item.Id).ToHashSet();
        var productIds = snapshot.Products.Select(item => item.Id).ToHashSet();
        var groupIds = snapshot.OptionGroups.Select(item => item.Id).ToHashSet();
        if (categoryIds.Count != snapshot.Categories.Count || productIds.Count != snapshot.Products.Count ||
            groupIds.Count != snapshot.OptionGroups.Count ||
            snapshot.Options.Select(item => item.Id).Distinct().Count() != snapshot.Options.Count ||
            snapshot.Discounts.Select(item => item.Id).Distinct().Count() != snapshot.Discounts.Count)
            issues.Add(Issue("catalog", "duplicate_id", "Catalog entries must have unique identifiers."));

        foreach (var product in snapshot.Products)
        {
            if (!categoryIds.Contains(product.CategoryId))
                issues.Add(Issue("categoryId", "missing_category", "Every product must belong to a restaurant category."));
            if (product.BasePrice < 0 || decimal.Round(product.BasePrice, 2) != product.BasePrice)
                issues.Add(Issue("basePrice", "invalid_price", "Product prices must be non-negative with at most two decimal places."));
            if (product.TaxRatePercent is < 0 or > 100 || decimal.Round(product.TaxRatePercent, 2) != product.TaxRatePercent)
                issues.Add(Issue("taxRatePercent", "invalid_tax_rate", "Product tax rates must be from 0 to 100 with at most two decimal places."));
        }

        foreach (var group in snapshot.OptionGroups)
        {
            if (!productIds.Contains(group.ProductId))
                issues.Add(Issue("productId", "missing_product", "Every option group must belong to a restaurant product."));
            if (group.MinimumSelections < 0 || group.MaximumSelections < 1 ||
                group.MaximumSelections > 20 || group.MinimumSelections > group.MaximumSelections)
                issues.Add(Issue("optionGroups", "invalid_selection_bounds", "Option group selection limits are invalid."));
            var parentIsActive = snapshot.Products.FirstOrDefault(product => product.Id == group.ProductId) is
                { IsArchived: false };
            var activeOptions = snapshot.Options.Count(option => option.GroupId == group.Id && !option.IsArchived);
            if (!group.IsArchived && parentIsActive && activeOptions < group.MinimumSelections)
                issues.Add(Issue("optionGroups", "incomplete_options", "Every active option group must have enough active options to meet its minimum."));
        }

        foreach (var option in snapshot.Options)
        {
            if (!groupIds.Contains(option.GroupId))
                issues.Add(Issue("groupId", "missing_option_group", "Every option must belong to a restaurant option group."));
            if (option.PriceAdjustment < 0 || decimal.Round(option.PriceAdjustment, 2) != option.PriceAdjustment)
                issues.Add(Issue("priceAdjustment", "invalid_price", "Option prices must be non-negative with at most two decimal places."));
        }

        foreach (var discount in snapshot.Discounts)
        {
            if (discount.Value <= 0 || decimal.Round(discount.Value, 2) != discount.Value ||
                (discount.Kind == "Percentage" && discount.Value > 100) ||
                (discount.Kind != "Percentage" && discount.Kind != "FixedAmount") ||
                discount.MinimumOrderAmount < 0 || decimal.Round(discount.MinimumOrderAmount, 2) != discount.MinimumOrderAmount)
                issues.Add(Issue("discounts", "invalid_discount", "Discount amounts and kinds are invalid."));
        }

        return issues;
    }

    public static IReadOnlyList<CatalogChangeDto> Compare(PublishedCatalogSnapshot before,
        PublishedCatalogSnapshot after)
    {
        var changes = new List<CatalogChangeDto>();
        AddChanges(changes, "category", before.Categories, after.Categories, item => item.Id, item => item.Name);
        AddChanges(changes, "product", before.Products, after.Products, item => item.Id, item => item.Name);
        AddChanges(changes, "optionGroup", before.OptionGroups, after.OptionGroups, item => item.Id, item => item.Name);
        AddChanges(changes, "option", before.Options, after.Options, item => item.Id, item => item.Name);
        AddChanges(changes, "discount", before.Discounts, after.Discounts, item => item.Id,
            item => $"{item.Name} ({item.Code})");

        var localeBefore = new { before.Locales, before.DefaultLocale };
        var localeAfter = new { after.Locales, after.DefaultLocale };
        var localeFields = Fields(localeBefore, localeAfter);
        if (localeFields.Count > 0)
            changes.Add(new CatalogChangeDto("languages", after.TenantId, "Menu languages", "updated", localeFields));

        return changes;
    }

    public static PublishedCatalogSnapshot WithAvailability(PublishedCatalogSnapshot snapshot, Guid productId,
        bool isAvailable)
    {
        var products = snapshot.Products.Select(product => product.Id == productId
            ? product with { IsAvailable = isAvailable }
            : product).ToArray();
        return snapshot with { Products = products };
    }

    private static void AddChanges<T>(ICollection<CatalogChangeDto> changes, string type,
        IReadOnlyList<T> before, IReadOnlyList<T> after, Func<T, Guid> id, Func<T, string> name)
    {
        var oldById = before.ToDictionary(id);
        var newById = after.ToDictionary(id);
        foreach (var entityId in oldById.Keys.Union(newById.Keys).Order())
        {
            var hasBefore = oldById.TryGetValue(entityId, out var oldValue);
            var hasAfter = newById.TryGetValue(entityId, out var newValue);
            if (!hasBefore && newValue is not null)
            {
                changes.Add(new CatalogChangeDto(type, entityId, name(newValue), "added", []));
                continue;
            }
            if (!hasAfter && oldValue is not null)
            {
                changes.Add(new CatalogChangeDto(type, entityId, name(oldValue), "removed", []));
                continue;
            }
            if (oldValue is null || newValue is null) continue;
            var fields = Fields(oldValue, newValue);
            if (fields.Count > 0)
                changes.Add(new CatalogChangeDto(type, entityId, name(newValue), "updated", fields));
        }
    }

    private static IReadOnlyList<CatalogFieldChangeDto> Fields<T>(T before, T after)
    {
        var oldNode = JsonSerializer.SerializeToNode(before, CatalogPublicationJson.Options) as JsonObject;
        var newNode = JsonSerializer.SerializeToNode(after, CatalogPublicationJson.Options) as JsonObject;
        if (oldNode is null || newNode is null) return [];

        return oldNode.Select(item => item.Key).Union(newNode.Select(item => item.Key), StringComparer.Ordinal)
            .Where(key => key != "id")
            .Order(StringComparer.Ordinal)
            .Where(key => !JsonNode.DeepEquals(oldNode[key], newNode[key]))
            .Select(key => new CatalogFieldChangeDto(key, oldNode[key]?.ToJsonString(), newNode[key]?.ToJsonString()))
            .ToArray();
    }

    private static ValidationIssue Issue(string field, string code, string message) => new(field, code, message);
}
