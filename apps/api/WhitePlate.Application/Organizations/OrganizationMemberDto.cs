namespace WhitePlate.Application.Organizations;

public sealed record OrganizationMemberDto(string Role, string? Email, Guid? TenantId, string? TenantName);
