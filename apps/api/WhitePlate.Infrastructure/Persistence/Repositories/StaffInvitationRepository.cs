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
        if (invitation is null || !invitation.TryAccept(identity, now)) return false;

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
            var role = invitation.Role == InvitationRole.RestaurantManager ? RestaurantRole.Manager : RestaurantRole.Kitchen;
            var exists = await database.RestaurantMemberships.AnyAsync(member =>
                member.TenantId == invitation.TenantId && member.Issuer == identity.Issuer &&
                member.Subject == identity.Subject, cancellationToken);
            if (!exists) database.RestaurantMemberships.Add(
                RestaurantMembership.Create(invitation.TenantId!.Value, identity, role));
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
        CancellationToken cancellationToken)
    {
        var isOwner = await database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(member =>
            member.OrganizationId == organizationId && member.Issuer == identity.Issuer &&
            member.Subject == identity.Subject, cancellationToken);
        if (!isOwner) return false;
        var invitation = await database.StaffInvitations.SingleOrDefaultAsync(item =>
            item.OrganizationId == organizationId && item.Id == invitationId, cancellationToken);
        if (invitation is null) return false;
        invitation.Revoke();
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }
}
