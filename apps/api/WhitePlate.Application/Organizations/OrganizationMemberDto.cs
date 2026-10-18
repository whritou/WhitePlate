namespace WhitePlate.Application.Organizations;

public sealed record OrganizationMemberDto(string Role, string? Email, Guid? TenantId, string? TenantName,
    Guid? MemberId = null, string? RoleId = null, string? RoleName = null, string? BuiltInKey = null);
