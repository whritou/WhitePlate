using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WhitePlate.Application.Media;
using WhitePlate.Domain.Media;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class MediaRepository(WhitePlateDbContext database) : IMediaRepository
{
    public async Task<IReadOnlyList<MediaAsset>> ActiveAsync(Guid tenantId, CancellationToken ct) =>
        await database.MediaAssets.AsNoTracking().Where(asset => asset.TenantId == tenantId && asset.IsActive).ToArrayAsync(ct);
    public Task<MediaAsset?> FindAsync(Guid tenantId, Guid id, CancellationToken ct) =>
        database.MediaAssets.AsNoTracking().SingleOrDefaultAsync(asset => asset.TenantId == tenantId && asset.Id == id, ct);

    public async Task<bool> AddPendingAsync(MediaAsset asset, CancellationToken ct)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            if (await database.MediaAssets.CountAsync(item => item.TenantId == asset.TenantId && !item.WasPublished, ct) >= 20) return false;
            database.MediaAssets.Add(asset);
            await database.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return true;
        }
        catch (Exception exception) when (exception is DbUpdateException { InnerException: PostgresException { SqlState: "40001" } } ||
            exception is PostgresException { SqlState: "40001" }) { return false; }
    }

    public async Task MarkReadyAsync(MediaAsset asset, CancellationToken ct)
    {
        asset.MarkReady();
        await database.SaveChangesAsync(ct);
    }

    public async Task<bool> SetActiveAsync(Guid tenantId, string slot, Guid? candidateId, Guid? expectedId,
        DateTimeOffset now, CancellationToken ct)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var active = await database.MediaAssets.SingleOrDefaultAsync(item => item.TenantId == tenantId && item.Slot == slot && item.IsActive, ct);
            if (active?.Id != expectedId) return false;
            var candidate = candidateId is null ? null : await database.MediaAssets.SingleOrDefaultAsync(
                item => item.TenantId == tenantId && item.Id == candidateId && item.Slot == slot, ct);
            if (candidateId is not null && (candidate is null || !candidate.IsReady || candidate.WasPublished || candidate.ExpiresAt <= now)) return false;
            if (active is not null)
            {
                active.Retire(now);
                await database.SaveChangesAsync(ct);
            }
            candidate?.Activate();
            await database.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return true;
        }
        catch (Exception exception) when (exception is DbUpdateConcurrencyException ||
            exception is DbUpdateException { InnerException: PostgresException { SqlState: "23505" or "40001" } } ||
            exception is PostgresException { SqlState: "40001" })
        {
            return false;
        }
    }
}
