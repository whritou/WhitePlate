using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Tenants;

public sealed record CreateRestaurantCommand(Guid OrganizationId, string Name, string Subdomain, string Currency,
    ExternalIdentity Identity);
