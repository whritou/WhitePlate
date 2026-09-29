using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class CatalogRepository(WhitePlateDbContext database) : ICatalogRepository
{
    public async Task<CatalogManagementDto?> GetManagementCatalogAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        var currency = await database.Tenants.AsNoTracking().Where(tenant => tenant.Id == tenantId)
            .Select(tenant => tenant.Currency).SingleOrDefaultAsync(cancellationToken);
        if (currency is null) return null;
        var categories = await database.MenuCategories.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var products = await database.Products.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var groups = await database.ProductOptionGroups.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var options = await database.ProductOptions.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.SortOrder).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        var discounts = await database.PromotionDiscounts.AsNoTracking().Where(item => item.TenantId == tenantId)
            .OrderBy(item => item.Code).ThenBy(item => item.Id).ToListAsync(cancellationToken);
        return new CatalogManagementDto(tenantId, currency,
            categories.Select(item => new CatalogCategoryAdminDto(item.Id, item.Name, item.SortOrder, item.IsArchived)).ToArray(),
            products.Select(item => new CatalogProductAdminDto(item.Id, item.CategoryId, item.Name, item.Description,
                item.BasePrice, item.TaxRatePercent, item.SortOrder, item.IsAvailable, item.IsArchived)).ToArray(),
            groups.Select(item => new CatalogOptionGroupAdminDto(item.Id, item.ProductId, item.Name,
                item.MinimumSelections, item.MaximumSelections, item.SortOrder, item.IsArchived)).ToArray(),
            options.Select(item => new CatalogOptionAdminDto(item.Id, item.GroupId, item.Name,
                item.PriceAdjustment, item.SortOrder, item.IsArchived)).ToArray(),
            discounts.Select(ToDto).ToArray());
    }

    public Task<bool> ProductBelongsToTenantAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken) =>
        database.Products.AsNoTracking().AnyAsync(product => product.TenantId == tenantId && product.Id == productId && !product.IsArchived, cancellationToken);

    public Task<bool> OptionGroupBelongsToTenantAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken) =>
        database.ProductOptionGroups.AsNoTracking().AnyAsync(group => group.TenantId == tenantId && group.Id == groupId && !group.IsArchived, cancellationToken);

    public async Task<MenuOptionGroupDto> AddOptionGroupAsync(WhitePlate.Domain.Catalog.ProductOptionGroup group, CancellationToken cancellationToken)
    {
        database.ProductOptionGroups.Add(group);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionGroupDto(group.Id, group.Name, group.MinimumSelections, group.MaximumSelections, group.SortOrder, []);
    }

    public async Task<MenuOptionDto> AddOptionAsync(WhitePlate.Domain.Catalog.ProductOption option, CancellationToken cancellationToken)
    {
        database.ProductOptions.Add(option);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionDto(option.Id, option.Name, option.PriceAdjustment, option.SortOrder);
    }

    public async Task<bool> AddDiscountAsync(WhitePlate.Domain.Catalog.PromotionDiscount discount, CancellationToken cancellationToken)
    {
        if (await database.PromotionDiscounts.AnyAsync(item => item.TenantId == discount.TenantId && item.Code == discount.Code, cancellationToken))
            return false;
        database.PromotionDiscounts.Add(discount);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<MenuCategoryDto?> UpdateCategoryAsync(Guid tenantId, Guid categoryId, string name,
        int sortOrder, CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == categoryId && !item.IsArchived, cancellationToken);
        if (category is null) return null;
        category.Update(name, sortOrder);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []);
    }

    public async Task<MenuProductDto?> UpdateProductAsync(Guid tenantId, Guid productId, string name,
        string? description, decimal basePrice, decimal taxRatePercent, int sortOrder, bool isAvailable,
        CancellationToken cancellationToken)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId && !item.IsArchived, cancellationToken);
        if (product is null) return null;
        product.Update(name, description, basePrice, taxRatePercent, sortOrder, isAvailable);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuProductDto(product.Id, product.Name, product.Description, product.BasePrice,
            product.TaxRatePercent, product.SortOrder, []);
    }

    public async Task<MenuOptionGroupDto?> UpdateOptionGroupAsync(Guid tenantId, Guid groupId, string name,
        int minimumSelections, int maximumSelections, int sortOrder, CancellationToken cancellationToken)
    {
        var group = await database.ProductOptionGroups.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == groupId && !item.IsArchived, cancellationToken);
        if (group is null) return null;
        group.Update(name, minimumSelections, maximumSelections, sortOrder);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionGroupDto(group.Id, group.Name, group.MinimumSelections, group.MaximumSelections,
            group.SortOrder, []);
    }

    public async Task<MenuOptionDto?> UpdateOptionAsync(Guid tenantId, Guid optionId, string name,
        decimal priceAdjustment, int sortOrder, CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == optionId && !item.IsArchived, cancellationToken);
        if (option is null) return null;
        option.Update(name, priceAdjustment, sortOrder);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuOptionDto(option.Id, option.Name, option.PriceAdjustment, option.SortOrder);
    }

    public async Task<PromotionDiscountDto?> UpdateDiscountAsync(Guid tenantId, Guid discountId, string name,
        WhitePlate.Domain.Catalog.DiscountKind kind, decimal value, CancellationToken cancellationToken)
    {
        var discount = await database.PromotionDiscounts.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == discountId && item.IsActive, cancellationToken);
        if (discount is null) return null;
        discount.Update(name, kind, value);
        await database.SaveChangesAsync(cancellationToken);
        return ToDto(discount);
    }

    public async Task<bool> ArchiveCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken)
    {
        var category = await database.MenuCategories.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == categoryId && !item.IsArchived, cancellationToken);
        if (category is null) return false;
        var products = await database.Products.Where(item => item.TenantId == tenantId &&
            item.CategoryId == categoryId && !item.IsArchived).ToListAsync(cancellationToken);
        var groups = await database.ProductOptionGroups.Where(item => item.TenantId == tenantId &&
            products.Select(product => product.Id).Contains(item.ProductId) && !item.IsArchived).ToListAsync(cancellationToken);
        var options = await database.ProductOptions.Where(item => item.TenantId == tenantId &&
            groups.Select(group => group.Id).Contains(item.GroupId) && !item.IsArchived).ToListAsync(cancellationToken);
        foreach (var option in options) option.Archive();
        foreach (var group in groups) group.Archive();
        foreach (var product in products) product.Archive();
        category.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ArchiveProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken)
    {
        var product = await database.Products.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == productId && !item.IsArchived, cancellationToken);
        if (product is null) return false;
        await ArchiveOptionGroupsAsync(tenantId, [productId], cancellationToken);
        product.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ArchiveOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken)
    {
        var group = await database.ProductOptionGroups.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == groupId && !item.IsArchived, cancellationToken);
        if (group is null) return false;
        await ArchiveOptionsAsync(tenantId, [groupId], cancellationToken);
        group.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ArchiveOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken)
    {
        var option = await database.ProductOptions.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == optionId && !item.IsArchived, cancellationToken);
        if (option is null) return false;
        option.Archive();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeactivateDiscountAsync(Guid tenantId, Guid discountId,
        CancellationToken cancellationToken)
    {
        var discount = await database.PromotionDiscounts.SingleOrDefaultAsync(item => item.TenantId == tenantId &&
            item.Id == discountId && item.IsActive, cancellationToken);
        if (discount is null) return false;
        discount.Deactivate();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ArchiveOptionGroupsAsync(Guid tenantId, Guid[] productIds, CancellationToken cancellationToken)
    {
        var groups = await database.ProductOptionGroups.Where(item => item.TenantId == tenantId &&
            productIds.Contains(item.ProductId) && !item.IsArchived).ToListAsync(cancellationToken);
        await ArchiveOptionsAsync(tenantId, groups.Select(group => group.Id).ToArray(), cancellationToken);
        foreach (var group in groups) group.Archive();
    }

    private async Task ArchiveOptionsAsync(Guid tenantId, Guid[] groupIds, CancellationToken cancellationToken)
    {
        var options = await database.ProductOptions.Where(item => item.TenantId == tenantId &&
            groupIds.Contains(item.GroupId) && !item.IsArchived).ToListAsync(cancellationToken);
        foreach (var option in options) option.Archive();
    }

    public Task<bool> CategoryBelongsToTenantAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken) =>
        database.MenuCategories.AsNoTracking().AnyAsync(category => category.TenantId == tenantId &&
            category.Id == categoryId && !category.IsArchived, cancellationToken);

    public async Task<MenuCategoryDto> AddCategoryAsync(WhitePlate.Domain.Catalog.MenuCategory category,
        CancellationToken cancellationToken)
    {
        database.MenuCategories.Add(category);
        await database.SaveChangesAsync(cancellationToken);
        return new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []);
    }

    public async Task<bool> AddProductAsync(WhitePlate.Domain.Catalog.Product product,
        CancellationToken cancellationToken)
    {
        database.Products.Add(product);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<MenuDto> GetMenuAsync(TenantDto tenant, CancellationToken cancellationToken)
    {
        var categories = await database.MenuCategories.AsNoTracking()
            .Where(category => category.TenantId == tenant.Id && !category.IsArchived)
            .OrderBy(category => category.SortOrder).ThenBy(category => category.Id)
            .Select(category => new { category.Id, category.Name, category.SortOrder })
            .ToListAsync(cancellationToken);
        var categoryIds = categories.Select(category => category.Id).ToArray();
        var products = await database.Products.AsNoTracking()
            .Where(product => product.TenantId == tenant.Id && categoryIds.Contains(product.CategoryId) &&
                product.IsAvailable && !product.IsArchived)
            .OrderBy(product => product.SortOrder).ThenBy(product => product.Id)
            .Select(product => new { product.Id, product.CategoryId, product.Name, product.Description,
                product.BasePrice, product.TaxRatePercent, product.SortOrder })
            .ToListAsync(cancellationToken);
        var productIds = products.Select(product => product.Id).ToArray();
        var groups = await database.ProductOptionGroups.AsNoTracking()
            .Where(group => group.TenantId == tenant.Id && productIds.Contains(group.ProductId) && !group.IsArchived)
            .OrderBy(group => group.SortOrder).ThenBy(group => group.Id)
            .Select(group => new { group.Id, group.ProductId, group.Name, group.MinimumSelections,
                group.MaximumSelections, group.SortOrder })
            .ToListAsync(cancellationToken);
        var groupIds = groups.Select(group => group.Id).ToArray();
        var options = await database.ProductOptions.AsNoTracking()
            .Where(option => option.TenantId == tenant.Id && groupIds.Contains(option.GroupId) && !option.IsArchived)
            .OrderBy(option => option.SortOrder).ThenBy(option => option.Id)
            .Select(option => new { option.Id, option.GroupId, option.Name, option.PriceAdjustment, option.SortOrder })
            .ToListAsync(cancellationToken);

        var groupsByProduct = groups.GroupBy(group => group.ProductId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<MenuOptionGroupDto>)group.Select(item => new MenuOptionGroupDto(item.Id,
                item.Name, item.MinimumSelections, item.MaximumSelections, item.SortOrder,
                options.Where(option => option.GroupId == item.Id).Select(option => new MenuOptionDto(option.Id,
                    option.Name, option.PriceAdjustment, option.SortOrder)).ToArray())).ToArray());
        var productsByCategory = products.GroupBy(product => product.CategoryId).ToDictionary(group => group.Key,
            group => (IReadOnlyList<MenuProductDto>)group.Select(item => new MenuProductDto(item.Id, item.Name,
                item.Description, item.BasePrice, item.TaxRatePercent, item.SortOrder,
                groupsByProduct.GetValueOrDefault(item.Id, []))).ToArray());
        return new MenuDto(tenant.Id, tenant.Name, tenant.Currency, categories.Select(category =>
            new MenuCategoryDto(category.Id, category.Name, category.SortOrder,
                productsByCategory.GetValueOrDefault(category.Id, []))).ToArray());
    }

    private static PromotionDiscountDto ToDto(WhitePlate.Domain.Catalog.PromotionDiscount discount) =>
        new(discount.Id, discount.Code, discount.Name, discount.Kind.ToString(), discount.Value, discount.IsActive);
}
