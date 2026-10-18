using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Organizations;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrganizationRoleGrantRepository(WhitePlateDbContext database) : IOrganizationRoleGrantRepository
{
    public async Task<IReadOnlyList<OrganizationRoleGrantSet>> ListAsync(Guid organizationId,
        CancellationToken cancellationToken) => await database.OrganizationRoleGrants.AsNoTracking()
        .Where(grant => grant.OrganizationId == organizationId)
        .OrderBy(grant => grant.Name).ToArrayAsync(cancellationToken);

    public Task<OrganizationRoleGrantSet?> GetAsync(Guid organizationId, RestaurantRole role,
        CancellationToken cancellationToken) => database.OrganizationRoleGrants.SingleOrDefaultAsync(
        grant => grant.OrganizationId == organizationId && grant.Role == role, cancellationToken);

    public Task<OrganizationRoleGrantSet?> GetByIdAsync(Guid organizationId, string roleId,
        CancellationToken cancellationToken) => database.OrganizationRoleGrants.SingleOrDefaultAsync(
        grant => grant.OrganizationId == organizationId && grant.RoleId == roleId, cancellationToken);

    public Task<bool> NameExistsAsync(Guid organizationId, string normalizedName, string? excludingRoleId,
        CancellationToken cancellationToken) => database.OrganizationRoleGrants.AsNoTracking().AnyAsync(grant =>
        grant.OrganizationId == organizationId && grant.NormalizedName == normalizedName &&
        grant.RoleId != excludingRoleId, cancellationToken);

    public async Task<bool> AddAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken)
    {
        database.OrganizationRoleGrants.Add(grant);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            database.Entry(grant).State = EntityState.Detached;
            return false;
        }
    }

    public async Task<bool> HasActiveAssignmentsAsync(Guid organizationId, string roleId, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var hasActiveMember = await database.RestaurantMemberships.AsNoTracking()
            .Join(database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId && tenant.IsActive),
                member => member.TenantId, tenant => tenant.Id, (member, tenant) => member)
            .AnyAsync(member => member.OrganizationId == organizationId && member.RoleId == roleId &&
                database.Organizations.Any(organization => organization.Id == organizationId && organization.IsActive),
                cancellationToken);
        if (hasActiveMember) return true;

        var pendingInvitations = await database.StaffInvitations.AsNoTracking()
            .Where(invitation => invitation.OrganizationId == organizationId && invitation.RoleId == roleId &&
                invitation.AcceptedSubject == null && !invitation.IsRevoked)
            .Select(invitation => invitation.ExpiresAt)
            .ToArrayAsync(cancellationToken);
        return pendingInvitations.Any(expiresAt => expiresAt > now);
    }

    public async Task<bool> SaveAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken)
    {
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            database.Entry(grant).State = EntityState.Detached;
            return false;
        }
    }
}
