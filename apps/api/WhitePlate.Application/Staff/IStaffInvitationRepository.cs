using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public interface IStaffInvitationRepository
{
    Task<bool> TenantBelongsToOrganizationAsync(Guid organizationId, Guid tenantId, CancellationToken cancellationToken);
    Task AddAsync(StaffInvitation invitation, CancellationToken cancellationToken);
    Task<bool> AcceptAsync(string tokenHash, ExternalIdentity identity, DateTimeOffset now,
        CancellationToken cancellationToken);
    Task<bool> RevokeAsync(Guid organizationId, Guid invitationId, ExternalIdentity identity,
        CancellationToken cancellationToken);
}
