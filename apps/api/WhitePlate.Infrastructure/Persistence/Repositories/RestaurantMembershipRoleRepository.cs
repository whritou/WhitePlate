using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class RestaurantMembershipRoleRepository(WhitePlateDbContext database) :
    IRestaurantMembershipRoleRepository
{
    public async Task<bool> ChangeRoleAsync(Guid organizationId, Guid memberId, string roleId,
        RestaurantRole compatibilityRole, CancellationToken cancellationToken)
    {
        var membership = await database.RestaurantMemberships.SingleOrDefaultAsync(member =>
            member.Id == memberId && member.OrganizationId == organizationId &&
            database.Tenants.Any(tenant => tenant.Id == member.TenantId && tenant.OrganizationId == organizationId),
            cancellationToken);
        if (membership is null || !await database.OrganizationRoleGrants.AsNoTracking().AnyAsync(role =>
                role.OrganizationId == organizationId && role.RoleId == roleId && !role.IsArchived,
                cancellationToken))
            return false;

        membership.ChangeRole(roleId, compatibilityRole);
        try
        {
            await database.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException)
        {
            database.Entry(membership).State = EntityState.Detached;
            return false;
        }
    }
}
