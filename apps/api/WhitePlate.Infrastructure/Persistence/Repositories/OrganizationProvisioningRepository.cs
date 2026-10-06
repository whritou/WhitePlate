using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Organizations;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrganizationProvisioningRepository(WhitePlateDbContext database) : IOrganizationProvisioningRepository, IOrganizationRepository
{
    public async Task<IReadOnlyList<OrganizationDto>> ListOwnedAsync(ExternalIdentity identity,
        CancellationToken cancellationToken) => await database.OrganizationOwnerMemberships.AsNoTracking()
        .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
        .Join(database.Organizations.AsNoTracking(), membership => membership.OrganizationId,
            organization => organization.Id, (membership, organization) => new OrganizationDto(organization.Id, organization.Name))
        .ToListAsync(cancellationToken);

    public async Task<Organization?> FindOwnedAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        var isOwner = await database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(membership =>
            membership.OrganizationId == organizationId && membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject, cancellationToken);
        return isOwner ? await database.Organizations.SingleOrDefaultAsync(item => item.Id == organizationId, cancellationToken) : null;
    }

    public async Task<IReadOnlyList<TenantDto>?> ListRestaurantsOwnedAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(membership =>
            membership.OrganizationId == organizationId && membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject, cancellationToken)) return null;
        var restaurants = await database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId)
            .OrderBy(tenant => tenant.Name).ToListAsync(cancellationToken);
        return restaurants.Select(TenantDto.FromDomain).ToArray();
    }

    public async Task<IReadOnlyList<OrganizationMemberDto>?> ListMembersOwnedAsync(Guid organizationId,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(organizationId, identity, cancellationToken)) return null;

        var owners = await database.OrganizationOwnerMemberships.AsNoTracking()
            .Where(member => member.OrganizationId == organizationId)
            .OrderBy(member => member.Issuer).ThenBy(member => member.Subject)
            .Select(member => new { member.Issuer, member.Subject })
            .ToListAsync(cancellationToken);
        var restaurantMembers = await database.RestaurantMemberships.AsNoTracking()
            .Join(database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId),
                member => member.TenantId, tenant => tenant.Id,
                (member, tenant) => new { Member = member, TenantName = tenant.Name })
            .OrderBy(item => item.TenantName).ThenBy(item => item.Member.Role)
            .ThenBy(item => item.Member.Issuer).ThenBy(item => item.Member.Subject)
            .Select(item => new
            {
                item.Member.TenantId,
                item.TenantName,
                item.Member.Issuer,
                item.Member.Subject,
                item.Member.Role
            })
            .ToListAsync(cancellationToken);
        var acceptedInvitations = await database.StaffInvitations.AsNoTracking()
            .Where(invitation => invitation.OrganizationId == organizationId && invitation.AcceptedSubject != null)
            .Select(invitation => new AcceptedInvitation(invitation.TenantId, invitation.Role,
                invitation.RecipientEmail, invitation.AcceptedIssuer, invitation.AcceptedSubject))
            .ToListAsync(cancellationToken);

        var members = owners.Select(member => new OrganizationMemberDto("OrganizationOwner",
                FindMemberEmail(acceptedInvitations, InvitationRole.OrganizationOwner, null,
                    member.Issuer, member.Subject, identity), null, null))
            .Concat(restaurantMembers.Select(member =>
            {
                var invitationRole = member.Role == RestaurantRole.Manager
                    ? InvitationRole.RestaurantManager
                    : InvitationRole.KitchenStaff;
                return new OrganizationMemberDto(invitationRole.ToString(),
                    FindMemberEmail(acceptedInvitations, invitationRole, member.TenantId,
                        member.Issuer, member.Subject, identity), member.TenantId, member.TenantName);
            }))
            .ToArray();

        return members;
    }

    public async Task<IReadOnlyList<OrganizationInvitationSummaryDto>?> ListInvitationsOwnedAsync(Guid organizationId,
        ExternalIdentity identity, DateTimeOffset now, CancellationToken cancellationToken)
    {
        if (!await IsOwnerAsync(organizationId, identity, cancellationToken)) return null;

        var tenantNames = await database.Tenants.AsNoTracking()
            .Where(tenant => tenant.OrganizationId == organizationId)
            .ToDictionaryAsync(tenant => tenant.Id, tenant => tenant.Name, cancellationToken);
        var invitations = await database.StaffInvitations.AsNoTracking()
            .Where(invitation => invitation.OrganizationId == organizationId)
            .OrderBy(invitation => invitation.Id)
            .Select(invitation => new
            {
                invitation.Id,
                invitation.Role,
                invitation.RecipientEmail,
                invitation.TenantId,
                invitation.ExpiresAt,
                invitation.IsRevoked,
                invitation.AcceptedSubject
            })
            .ToListAsync(cancellationToken);

        return invitations.Select(invitation => new OrganizationInvitationSummaryDto(invitation.Id,
            invitation.Role.ToString(), invitation.RecipientEmail!, invitation.TenantId,
            invitation.TenantId is { } tenantId ? tenantNames.GetValueOrDefault(tenantId) : null,
            invitation.ExpiresAt, GetInvitationStatus(invitation.AcceptedSubject, invitation.IsRevoked,
                invitation.ExpiresAt, now))).ToArray();
    }

    private Task<bool> IsOwnerAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken) =>
        database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(member =>
            member.OrganizationId == organizationId && member.Issuer == identity.Issuer &&
            member.Subject == identity.Subject, cancellationToken);

    private static string? FindMemberEmail(IReadOnlyCollection<AcceptedInvitation> invitations,
        InvitationRole role, Guid? tenantId, string issuer, string subject, ExternalIdentity currentIdentity)
    {
        var invitation = invitations.FirstOrDefault(item => item.Role == role && item.TenantId == tenantId &&
            item.AcceptedIssuer == issuer && item.AcceptedSubject == subject);
        if (invitation?.RecipientEmail is { } email) return email;
        return currentIdentity.Issuer == issuer && currentIdentity.Subject == subject && currentIdentity.EmailVerified
            ? currentIdentity.Email
            : null;
    }

    private static string GetInvitationStatus(string? acceptedSubject, bool isRevoked, DateTimeOffset expiresAt,
        DateTimeOffset now) => acceptedSubject is not null ? "Accepted" : isRevoked ? "Revoked" :
        now >= expiresAt ? "Expired" : "Pending";

    private sealed record AcceptedInvitation(Guid? TenantId, InvitationRole Role, string? RecipientEmail,
        string? AcceptedIssuer, string? AcceptedSubject);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => database.SaveChangesAsync(cancellationToken);

    public async Task CreateAsync(Organization organization, OrganizationOwnerMembership owner,
        CancellationToken cancellationToken)
    {
        database.Organizations.Add(organization);
        database.OrganizationOwnerMemberships.Add(owner);
        await database.SaveChangesAsync(cancellationToken);
    }
}
