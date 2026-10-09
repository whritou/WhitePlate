using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WhitePlate.Application.Media;
using WhitePlate.Domain.Media;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class ProductPhotoRepository(WhitePlateDbContext database) : IProductPhotoRepository
{
    public Task<bool> PublicProductExistsAsync(Guid tenantId, Guid productId, CancellationToken ct) =>
        database.Products.AsNoTracking().AnyAsync(product => product.TenantId == tenantId && product.Id == productId &&
            !product.IsArchived && database.MenuCategories.Any(category => category.TenantId == tenantId &&
                category.Id == product.CategoryId && !category.IsArchived && category.IsVisible), ct);

    public Task<bool> ProductExistsAsync(Guid tenantId, Guid productId, bool writable, CancellationToken ct) =>
        database.Products.AnyAsync(product => product.TenantId == tenantId && product.Id == productId &&
            (!writable || (!product.IsArchived && database.MenuCategories.Any(category =>
                category.TenantId == tenantId && category.Id == product.CategoryId && !category.IsArchived))), ct);

    public async Task<IReadOnlyList<MediaAsset>> ListAsync(Guid tenantId, Guid productId, CancellationToken ct) =>
        await database.MediaAssets.AsNoTracking().Where(asset => asset.TenantId == tenantId &&
            asset.ProductId == productId && asset.IsActive).OrderBy(asset => asset.SortOrder).ThenBy(asset => asset.Id).ToArrayAsync(ct);

    public async Task<bool> SaveAsync(Guid tenantId, Guid productId, IReadOnlyList<Guid> ids,
        IReadOnlyList<Guid> expectedIds, DateTimeOffset now, CancellationToken ct)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            if (!await ProductExistsAsync(tenantId, productId, true, ct)) return false;
            var rows = await database.MediaAssets.Where(asset => asset.TenantId == tenantId &&
                asset.ProductId == productId && (asset.IsActive || ids.Contains(asset.Id))).ToListAsync(ct);
            var active = rows.Where(asset => asset.IsActive).OrderBy(asset => asset.SortOrder).ThenBy(asset => asset.Id).ToArray();
            if (!active.Select(asset => asset.Id).SequenceEqual(expectedIds)) return false;
            var candidates = ids.Select(id => rows.SingleOrDefault(asset => asset.Id == id)).ToArray();
            if (candidates.Any(asset => asset is null || !asset.IsReady || asset.ExpiresAt <= now ||
                (asset.WasPublished && !asset.IsActive))) return false;
            foreach (var asset in active.Where(asset => !ids.Contains(asset.Id))) asset.Retire(now);
            for (var index = 0; index < candidates.Length; index++)
            {
                candidates[index]!.SetOrder(index);
                candidates[index]!.Activate();
            }
            await database.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return true;
        }
        catch (Exception exception) when (exception is DbUpdateConcurrencyException ||
            exception is DbUpdateException { InnerException: PostgresException { SqlState: "40001" } } ||
            exception is PostgresException { SqlState: "40001" }) { return false; }
    }
}
