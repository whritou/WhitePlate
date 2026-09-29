using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public sealed record CreateStaffInvitationCommand(Guid OrganizationId, Guid? TenantId, InvitationRole Role,
    ExternalIdentity Identity);
