using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Staff;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class StaffInvitationRepository(WhitePlateDbContext database) : IStaffInvitationRepository
{
    public Task<bool> TenantBelongsToOrganizationAsync(Guid organizationId, Guid tenantId,
        CancellationToken cancellationToken) => database.Tenants.AsNoTracking().AnyAsync(
        tenant => tenant.OrganizationId == organizationId && tenant.Id == tenantId, cancellationToken);

    public Task<bool> RoleBelongsToOrganizationAsync(Guid organizationId, string roleId,
        CancellationToken cancellationToken) => database.OrganizationRoleGrants.AsNoTracking().AnyAsync(
        role => role.OrganizationId == organizationId && role.RoleId == roleId && !role.IsArchived,
        cancellationToken);

    public async Task AddAsync(StaffInvitation invitation, CancellationToken cancellationToken)
    {
        database.StaffInvitations.Add(invitation);
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> AcceptAsync(string tokenHash, ExternalIdentity identity, DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var invitation = await database.StaffInvitations.SingleOrDefaultAsync(
            item => item.TokenHash == tokenHash, cancellationToken);
        if (invitation is null || !await database.Organizations.AsNoTracking().AnyAsync(
                organization => organization.Id == invitation.OrganizationId && organization.IsActive, cancellationToken))
            return false;

        var roleGrant = invitation.Role == InvitationRole.OrganizationOwner ? null :
            await database.OrganizationRoleGrants.AsNoTracking().SingleOrDefaultAsync(grant =>
                grant.OrganizationId == invitation.OrganizationId && grant.RoleId == invitation.RoleId &&
                !grant.IsArchived, cancellationToken);
        if (invitation.Role != InvitationRole.OrganizationOwner && roleGrant is null) return false;
        if (!invitation.TryAccept(identity, now)) return false;

        if (invitation.Role == InvitationRole.OrganizationOwner)
        {
            var exists = await database.OrganizationOwnerMemberships.AnyAsync(member =>
                member.OrganizationId == invitation.OrganizationId && member.Issuer == identity.Issuer &&
                member.Subject == identity.Subject, cancellationToken);
            if (!exists) database.OrganizationOwnerMemberships.Add(
                OrganizationOwnerMembership.Create(invitation.OrganizationId, identity));
        }
        else
        {
            var exists = await database.RestaurantMemberships.AnyAsync(member =>
                member.TenantId == invitation.TenantId && member.Issuer == identity.Issuer &&
                member.Subject == identity.Subject, cancellationToken);
            if (!exists) database.RestaurantMemberships.Add(
                RestaurantMembership.Create(invitation.OrganizationId, invitation.TenantId!.Value, identity,
                    roleGrant!.RoleId, roleGrant.Role));
        }

        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            database.Entry(invitation).State = EntityState.Detached;
            return false;
        }
    }

    public async Task<bool> RevokeAsync(Guid organizationId, Guid invitationId, ExternalIdentity identity,
        DateTimeOffset now, CancellationToken cancellationToken)
    {
        var isOwner = await database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(member =>
            member.OrganizationId == organizationId && member.Issuer == identity.Issuer &&
            member.Subject == identity.Subject && database.Organizations.Any(organization =>
                organization.Id == member.OrganizationId && organization.IsActive), cancellationToken);
        var invitation = await database.StaffInvitations.SingleOrDefaultAsync(item =>
            item.OrganizationId == organizationId && item.Id == invitationId, cancellationToken);
        if (invitation is null) return false;
        if (!isOwner)
        {
            if (invitation.Role == InvitationRole.OrganizationOwner || invitation.TenantId is not { } tenantId)
                return false;
            var canManage = await database.RestaurantMemberships.AsNoTracking()
                .Where(member => member.TenantId == tenantId && member.Issuer == identity.Issuer &&
                    member.Subject == identity.Subject)
                .AnyAsync(member => database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == organizationId &&
                    grant.RoleId == member.RoleId && !grant.IsArchived &&
                    (grant.Permissions & RestaurantPermission.StaffManage) != RestaurantPermission.None),
                    cancellationToken);
            if (!canManage) return false;
        }
        if (!invitation.TryRevoke(now)) return false;
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }
}
