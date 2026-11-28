using Microsoft.EntityFrameworkCore;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

/// <summary>
/// Staff-facing names for product rankings. Order lines snapshot the product name in the guest's menu
/// language, so rankings group by product ID and display the current catalog name, which is stored in the
/// restaurant's default menu locale. Callers supply a snapshot fallback for products without a catalog row.
/// </summary>
internal static class ProductDisplayNames
{
    public static async Task<Dictionary<Guid, string>> LoadAsync(WhitePlateDbContext database, Guid tenantId,
        IReadOnlyCollection<Guid> productIds, CancellationToken cancellationToken)
    {
        if (productIds.Count == 0) return [];
        var ids = productIds.Distinct().ToArray();
        return await database.Products.AsNoTracking()
            .Where(product => product.TenantId == tenantId && ids.Contains(product.Id))
            .Select(product => new { product.Id, product.Name })
            .ToDictionaryAsync(product => product.Id, product => product.Name, cancellationToken);
    }
}
