namespace WhitePlate.Application.Organizations;

public sealed record OrganizationInvitationSummaryDto(Guid Id, string Role, string Email, Guid? TenantId,
    string? TenantName, DateTimeOffset ExpiresAt, string Status, string? RoleId = null, string? RoleName = null,
    string? BuiltInKey = null);
