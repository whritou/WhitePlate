namespace WhitePlate.Application.Staff;

public sealed record StaffInvitationDto(Guid Id, string Token, DateTimeOffset ExpiresAt);
