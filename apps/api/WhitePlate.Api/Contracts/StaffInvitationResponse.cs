namespace WhitePlate.Api.Contracts;

public sealed record StaffInvitationResponse(Guid Id, string Token, DateTimeOffset ExpiresAt);
