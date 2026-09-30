using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public sealed record CreateStaffInvitationCommand(Guid OrganizationId, Guid? TenantId, string RecipientEmail,
    InvitationRole Role, ExternalIdentity Identity);
