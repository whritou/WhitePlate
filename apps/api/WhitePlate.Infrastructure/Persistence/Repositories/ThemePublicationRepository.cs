using System.Data;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Media;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class ThemePublicationRepository(WhitePlateDbContext database) : IThemePublicationRepository
{
    private IQueryable<Tenant> Active(Guid id) => database.Tenants.Where(row => row.Id == id && row.IsActive &&
        database.Organizations.Any(organization => organization.Id == row.OrganizationId && organization.IsActive));

    public Task<Tenant?> GetAsync(Guid tenantId, CancellationToken ct) =>
        Active(tenantId).AsNoTracking().SingleOrDefaultAsync(ct);

    public Task<Tenant?> GetPublicAsync(Guid tenantId, CancellationToken ct) =>
        Active(tenantId).AsNoTracking().SingleOrDefaultAsync(ct);

    public async Task<ThemePublicationWriteOutcome> PublishAsync(Guid tenantId, ExternalIdentity identity,
        int draftVersion, int publicationVersion, DateTimeOffset now, CancellationToken ct)
    {
        await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct);
        try
        {
            var lockedTenants = await database.Tenants.FromSqlInterpolated(
                $"SELECT * FROM \"Tenants\" WHERE \"Id\" = {tenantId} FOR UPDATE").ToListAsync(ct);
            var tenant = lockedTenants.SingleOrDefault();
            if (tenant is null || !tenant.IsActive || !await database.Organizations.AnyAsync(
                    organization => organization.Id == tenant.OrganizationId && organization.IsActive, ct))
                return new(ThemePublicationWriteResult.NotFound);

            var owner = await database.OrganizationOwnerMemberships.AnyAsync(membership =>
                membership.OrganizationId == tenant.OrganizationId && membership.Issuer == identity.Issuer &&
                membership.Subject == identity.Subject, ct);
            var manager = await database.RestaurantMemberships.AnyAsync(membership => membership.TenantId == tenantId &&
                membership.Issuer == identity.Issuer && membership.Subject == identity.Subject &&
                database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == tenant.OrganizationId &&
                    grant.RoleId == membership.RoleId && !grant.IsArchived &&
                    (grant.Permissions & RestaurantPermission.StorefrontManage) == RestaurantPermission.StorefrontManage), ct);
            if (!owner && !manager) return new(ThemePublicationWriteResult.NotFound);
            if (tenant.ThemeDraftVersion != draftVersion || tenant.ThemePublicationVersion != publicationVersion)
                return new(ThemePublicationWriteResult.PreconditionFailed);

            var activeAssets = await database.MediaAssets.Where(asset => asset.TenantId == tenantId &&
                asset.ProductId == null && asset.IsActive && (asset.Slot == "logo" || asset.Slot == "favicon" || asset.Slot == "banner"))
                .ToArrayAsync(ct);
            if (activeAssets.Any(asset => !asset.IsReady || asset.ExpiresAt <= now))
                throw new WhitePlate.Domain.Common.DomainRuleException("invalid_theme_publication", "brandAssets",
                    "A saved brand asset is not ready to publish.");

            Guid? Asset(string slot) => activeAssets.SingleOrDefault(asset => asset.Slot == slot)?.Id;
            var snapshot = new ThemePublicationSnapshot(tenant.GetThemeDraft(), Asset("logo"), Asset("favicon"),
                Asset("banner"), tenant.ThemeDraftVersion, now);
            snapshot.Validate();

            var selectedIds = activeAssets.Select(asset => asset.Id).ToHashSet();
            var publishedAssets = await database.MediaAssets.Where(asset => asset.TenantId == tenantId &&
                asset.ProductId == null && (asset.Slot == "logo" || asset.Slot == "favicon" || asset.Slot == "banner") &&
                (asset.IsInPublishedTheme || selectedIds.Contains(asset.Id))).ToArrayAsync(ct);
            foreach (var asset in publishedAssets) asset.SetInPublishedTheme(selectedIds.Contains(asset.Id), now);

            if (!tenant.SetPublishedTheme(snapshot, draftVersion, publicationVersion))
                return new(ThemePublicationWriteResult.PreconditionFailed);
            await database.SaveChangesAsync(ct);
            await transaction.CommitAsync(ct);
            return new(ThemePublicationWriteResult.Published, new(snapshot.Appearance, snapshot.LogoAssetId,
                snapshot.FaviconAssetId, snapshot.BannerAssetId, snapshot.SourceDraftVersion,
                snapshot.PublishedAt, tenant.ThemePublicationVersion));
        }
        catch (Exception exception) when (exception is PostgresException { SqlState: "40001" } ||
            exception is DbUpdateException { InnerException: PostgresException { SqlState: "40001" } })
        {
            return new(ThemePublicationWriteResult.PreconditionFailed);
        }
    }
}
