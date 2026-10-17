using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Organizations;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrganizationRoleGrantRepository(WhitePlateDbContext database) : IOrganizationRoleGrantRepository
{
    public async Task<IReadOnlyList<OrganizationRoleGrantSet>> ListAsync(Guid organizationId,
        CancellationToken cancellationToken) => await database.OrganizationRoleGrants.AsNoTracking()
        .Where(grant => grant.OrganizationId == organizationId)
        .OrderBy(grant => grant.Role).ToArrayAsync(cancellationToken);

    public Task<OrganizationRoleGrantSet?> GetAsync(Guid organizationId, RestaurantRole role,
        CancellationToken cancellationToken) => database.OrganizationRoleGrants.SingleOrDefaultAsync(
        grant => grant.OrganizationId == organizationId && grant.Role == role, cancellationToken);

    public async Task<bool> SaveAsync(OrganizationRoleGrantSet grant, CancellationToken cancellationToken)
    {
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateConcurrencyException)
        {
            database.Entry(grant).State = EntityState.Detached;
            return false;
        }
    }
}
