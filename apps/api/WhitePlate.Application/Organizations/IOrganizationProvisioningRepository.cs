using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Organizations;

public interface IOrganizationProvisioningRepository
{
    Task CreateAsync(Organization organization, OrganizationOwnerMembership owner, CancellationToken cancellationToken);
}
