using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Application.Tenants;

namespace WhitePlate.Application.Organizations;

public interface IOrganizationRepository
{
    Task<IReadOnlyList<OrganizationDto>> ListOwnedAsync(ExternalIdentity identity, CancellationToken cancellationToken);
    Task<Organization?> FindOwnedAsync(Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken);
    Task<IReadOnlyList<TenantDto>?> ListRestaurantsOwnedAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
