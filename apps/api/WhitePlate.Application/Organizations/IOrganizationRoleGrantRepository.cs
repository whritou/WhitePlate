using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Organizations;

public interface IOrganizationRoleGrantRepository
{
    Task<IReadOnlyList<OrganizationRoleGrantSet>> ListAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<OrganizationRoleGrantSet?> GetAsync(Guid organizationId, RestaurantRole role, CancellationToken cancellationToken);
    Task<OrganizationRoleGrantSet?> GetByIdAsync(Guid organizationId, string roleId,
        CancellationToken cancellationToken) => Enum.TryParse<RestaurantRole>(roleId, out var role) &&
        Enum.IsDefined(role) ? GetAsync(organizationId, role, cancellationToken) :
        Task.FromResult<OrganizationRoleGrantSet?>(null);
    Task<bool> NameExistsAsync(Guid organizationId, string normalizedName, string? excludingRoleId,
        CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> AddAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken) =>
        Task.FromResult(false);
    Task<bool> HasActiveAssignmentsAsync(Guid organizationId, string roleId, DateTimeOffset now,
        CancellationToken cancellationToken) => Task.FromResult(false);
    Task<bool> SaveAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken);
}
