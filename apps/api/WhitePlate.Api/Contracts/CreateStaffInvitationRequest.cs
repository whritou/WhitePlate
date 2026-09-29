namespace WhitePlate.Api.Contracts;

public sealed record CreateStaffInvitationRequest(Guid? TenantId, string Role);
