using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Organizations;

public interface IRestaurantMembershipRoleRepository
{
    Task<bool> ChangeRoleAsync(Guid organizationId, Guid memberId, string roleId, RestaurantRole compatibilityRole,
        CancellationToken cancellationToken);
}
