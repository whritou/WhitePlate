using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Media;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Infrastructure.Media;

public sealed class ExpiredMediaCleanup(WhitePlateDbContext database, IMediaStorage storage, TimeProvider clock)
{
    public async Task RunAsync(CancellationToken ct)
    {
        if (!storage.IsAvailable) return;
        var now = clock.GetUtcNow();
        var assets = await database.MediaAssets.AsNoTracking().Where(asset => !asset.IsActive && asset.ExpiresAt < now)
            .OrderBy(asset => asset.ExpiresAt).Take(50).ToArrayAsync(ct);
        foreach (var asset in assets)
        {
            // Claim before deleting bytes. A concurrent activation either commits first (claim skips it),
            // or loses its serializable transaction to this write. The tombstone cannot be activated.
            var claimed = await database.MediaAssets.Where(item => item.Id == asset.Id && item.TenantId == asset.TenantId &&
                !item.IsActive && item.ExpiresAt < now).ExecuteUpdateAsync(update => update
                    .SetProperty(item => item.IsReady, false)
                    .SetProperty(item => item.ExpiresAt, DateTimeOffset.UnixEpoch), ct);
            if (claimed == 0) continue;
            await storage.DeleteAsync(asset.ObjectKey, ct);
            database.MediaAssets.Remove(asset);
            await database.SaveChangesAsync(ct);
        }
    }
}
