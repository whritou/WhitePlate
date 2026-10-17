using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Identity;

public sealed record OrganizationMembershipDto(Guid Id, string Name, string Role);
public sealed record RestaurantMembershipDto(Guid Id, Guid OrganizationId, string Name, string Subdomain,
    string Currency, string Role, IReadOnlyList<string> Permissions);
public sealed record CurrentUserDto(string Issuer, string Subject,
    IReadOnlyList<OrganizationMembershipDto> Organizations, IReadOnlyList<RestaurantMembershipDto> Restaurants);
