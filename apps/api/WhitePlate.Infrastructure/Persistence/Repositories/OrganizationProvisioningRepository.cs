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
        CancellationToken cancellationToken) => (await database.OrganizationOwnerMemberships.AsNoTracking()
        .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
        .Join(database.Organizations.AsNoTracking(), membership => membership.OrganizationId,
            organization => organization.Id, (membership, organization) => organization)
        .ToListAsync(cancellationToken)).Select(OrganizationDto.FromDomain).ToArray();

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
        var access = await GetStaffAccessAsync(organizationId, identity, cancellationToken);
        if (access is null) return null;

        var owners = await database.OrganizationOwnerMemberships.AsNoTracking()
            .Where(member => access.IsOwner && member.OrganizationId == organizationId)
            .OrderBy(member => member.Issuer).ThenBy(member => member.Subject)
            .Select(member => new { member.Issuer, member.Subject })
            .ToListAsync(cancellationToken);
        var restaurantMembers = await database.RestaurantMemberships.AsNoTracking()
            .Join(database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId &&
                    (access.IsOwner || access.TenantIds.Contains(tenant.Id))),
                member => member.TenantId, tenant => tenant.Id,
                (member, tenant) => new { Member = member, TenantName = tenant.Name, tenant.OrganizationId })
            .Join(database.OrganizationRoleGrants.AsNoTracking().Where(grant => grant.OrganizationId == organizationId &&
                    !grant.IsArchived),
                item => new { item.OrganizationId, item.Member.RoleId },
                grant => new { grant.OrganizationId, grant.RoleId },
                (item, grant) => new { item.Member, item.TenantName, Grant = grant })
            .OrderBy(item => item.TenantName).ThenBy(item => item.Grant.Name)
            .ThenBy(item => item.Member.Issuer).ThenBy(item => item.Member.Subject)
            .Select(item => new
            {
                item.Member.Id,
                item.Member.TenantId,
                item.TenantName,
                item.Member.Issuer,
                item.Member.Subject,
                item.Member.Role,
                item.Grant.RoleId,
                item.Grant.Name
            })
            .ToListAsync(cancellationToken);
        var acceptedInvitations = await database.StaffInvitations.AsNoTracking()
            .Where(invitation => invitation.OrganizationId == organizationId &&
                (access.IsOwner || invitation.TenantId != null && access.TenantIds.Contains(invitation.TenantId.Value)) &&
                invitation.AcceptedSubject != null)
            .Select(invitation => new AcceptedInvitation(invitation.TenantId,
                invitation.RecipientEmail, invitation.AcceptedIssuer, invitation.AcceptedSubject))
            .ToListAsync(cancellationToken);

        var members = owners.Select(member => new OrganizationMemberDto("OrganizationOwner",
                FindMemberEmail(acceptedInvitations, null, member.Issuer, member.Subject, identity), null, null,
                null, null, "Owner", "OrganizationOwner"))
            .Concat(restaurantMembers.Select(member =>
            {
                var invitationRole = ToInvitationRole(member.Role);
                return new OrganizationMemberDto(invitationRole.ToString(),
                    FindMemberEmail(acceptedInvitations, member.TenantId, member.Issuer, member.Subject, identity),
                    member.TenantId, member.TenantName,
                    member.Id, member.RoleId, member.Name, member.RoleId == member.Role.ToString()
                        ? member.Role.ToString()
                        : null);
            }))
            .ToArray();

        return members;
    }

    public async Task<IReadOnlyList<OrganizationInvitationSummaryDto>?> ListInvitationsOwnedAsync(Guid organizationId,
        ExternalIdentity identity, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var access = await GetStaffAccessAsync(organizationId, identity, cancellationToken);
        if (access is null) return null;

        var tenantNames = await database.Tenants.AsNoTracking()
            .Where(tenant => tenant.OrganizationId == organizationId &&
                (access.IsOwner || access.TenantIds.Contains(tenant.Id)))
            .ToDictionaryAsync(tenant => tenant.Id, tenant => tenant.Name, cancellationToken);
        var invitations = await database.StaffInvitations.AsNoTracking()
            .Where(invitation => invitation.OrganizationId == organizationId &&
                (access.IsOwner || invitation.TenantId != null && access.TenantIds.Contains(invitation.TenantId.Value)) &&
                (access.IsOwner || invitation.Role != InvitationRole.OrganizationOwner))
            .OrderBy(invitation => invitation.Id)
            .Select(invitation => new
            {
                invitation.Id,
                invitation.Role,
                invitation.RoleId,
                invitation.RecipientEmail,
                invitation.TenantId,
                invitation.ExpiresAt,
                invitation.IsRevoked,
                invitation.AcceptedSubject
            })
            .ToListAsync(cancellationToken);

        var roleIds = invitations.Select(invitation => invitation.RoleId)
            .Where(roleId => roleId != null).Select(roleId => roleId!).Distinct().ToArray();
        var roleNames = await database.OrganizationRoleGrants.AsNoTracking()
            .Where(role => role.OrganizationId == organizationId && roleIds.Contains(role.RoleId))
            .ToDictionaryAsync(role => role.RoleId, role => role.Name, cancellationToken);

        return invitations.Select(invitation => new OrganizationInvitationSummaryDto(invitation.Id,
            invitation.Role.ToString(), invitation.RecipientEmail!, invitation.TenantId,
            invitation.TenantId is { } tenantId ? tenantNames.GetValueOrDefault(tenantId) : null,
            invitation.ExpiresAt, GetInvitationStatus(invitation.AcceptedSubject, invitation.IsRevoked,
                invitation.ExpiresAt, now), invitation.RoleId,
            invitation.RoleId is { } roleId ? roleNames.GetValueOrDefault(roleId) : "Owner",
            invitation.Role == InvitationRole.OrganizationOwner ? "OrganizationOwner" :
                invitation.RoleId is { } systemRoleId && roleNames.ContainsKey(systemRoleId)
                    ? Enum.TryParse<RestaurantRole>(systemRoleId, out var systemRole) &&
                      systemRoleId == systemRole.ToString() ? systemRoleId : null
                    : null)).ToArray();
    }

    private async Task<OrganizationStaffAccess?> GetStaffAccessAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (await IsOwnerAsync(organizationId, identity, cancellationToken))
            return new OrganizationStaffAccess(true, []);

        var tenantIds = await database.RestaurantMemberships.AsNoTracking()
            .Join(database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId && tenant.IsActive),
                member => member.TenantId, tenant => tenant.Id,
                (member, tenant) => new { Member = member, TenantId = tenant.Id })
            .Where(item => item.Member.Issuer == identity.Issuer && item.Member.Subject == identity.Subject &&
                database.Organizations.Any(organization => organization.Id == organizationId && organization.IsActive) &&
                database.OrganizationRoleGrants.Any(grant => grant.OrganizationId == organizationId &&
                    grant.RoleId == item.Member.RoleId && !grant.IsArchived &&
                    (grant.Permissions & RestaurantPermission.StaffManage) != RestaurantPermission.None))
            .Select(item => item.TenantId)
            .Distinct()
            .ToArrayAsync(cancellationToken);

        return tenantIds.Length == 0 ? null : new OrganizationStaffAccess(false, tenantIds);
    }
    private Task<bool> IsOwnerAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken) =>
        database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(member =>
            member.OrganizationId == organizationId && member.Issuer == identity.Issuer &&
            member.Subject == identity.Subject, cancellationToken);

    private static string? FindMemberEmail(IReadOnlyCollection<AcceptedInvitation> invitations,
        Guid? tenantId, string issuer, string subject, ExternalIdentity currentIdentity)
    {
        var invitation = invitations.FirstOrDefault(item => item.TenantId == tenantId &&
            item.AcceptedIssuer == issuer && item.AcceptedSubject == subject);
        if (invitation?.RecipientEmail is { } email) return email;
        return currentIdentity.Issuer == issuer && currentIdentity.Subject == subject && currentIdentity.EmailVerified
            ? currentIdentity.Email
            : null;
    }

    private static string GetInvitationStatus(string? acceptedSubject, bool isRevoked, DateTimeOffset expiresAt,
        DateTimeOffset now) => acceptedSubject is not null ? "Accepted" : isRevoked ? "Revoked" :
        now >= expiresAt ? "Expired" : "Pending";

    private sealed record OrganizationStaffAccess(bool IsOwner, Guid[] TenantIds);

    private sealed record AcceptedInvitation(Guid? TenantId, string? RecipientEmail,
        string? AcceptedIssuer, string? AcceptedSubject);

    private static InvitationRole ToInvitationRole(RestaurantRole role) => role switch
    {
        RestaurantRole.Manager => InvitationRole.RestaurantManager,
        RestaurantRole.Kitchen => InvitationRole.KitchenStaff,
        RestaurantRole.Staff => InvitationRole.RestaurantStaff,
        RestaurantRole.Accountant => InvitationRole.Accountant,
        _ => throw new InvalidOperationException("Unsupported restaurant role.")
    };

    public Task SaveChangesAsync(CancellationToken cancellationToken) => database.SaveChangesAsync(cancellationToken);

    public async Task CreateAsync(Organization organization, OrganizationOwnerMembership owner,
        CancellationToken cancellationToken)
    {
        database.Organizations.Add(organization);
        database.OrganizationOwnerMemberships.Add(owner);
        database.OrganizationRoleGrants.AddRange(new[]
        {
            RestaurantRole.Manager,
            RestaurantRole.Kitchen,
            RestaurantRole.Accountant
        }.Select(role => OrganizationRoleGrantSet.CreateDefault(organization.Id, role)));
        await database.SaveChangesAsync(cancellationToken);
    }
}
