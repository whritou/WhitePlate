using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Organizations;

public interface IOrganizationRoleGrantRepository
{
    Task<IReadOnlyList<OrganizationRoleGrantSet>> ListAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<OrganizationRoleGrantSet?> GetAsync(Guid organizationId, RestaurantRole role, CancellationToken cancellationToken);
    Task<bool> SaveAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken);
}
