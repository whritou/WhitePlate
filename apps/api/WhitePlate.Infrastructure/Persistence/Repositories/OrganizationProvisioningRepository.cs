using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Organizations;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class OrganizationProvisioningRepository(WhitePlateDbContext database) : IOrganizationProvisioningRepository, IOrganizationRepository
{
    public async Task<IReadOnlyList<OrganizationDto>> ListOwnedAsync(ExternalIdentity identity,
        CancellationToken cancellationToken) => await database.OrganizationOwnerMemberships.AsNoTracking()
        .Where(membership => membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)
        .Join(database.Organizations.AsNoTracking(), membership => membership.OrganizationId,
            organization => organization.Id, (membership, organization) => new OrganizationDto(organization.Id, organization.Name))
        .ToListAsync(cancellationToken);

    public async Task<Organization?> FindOwnedAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        var isOwner = await database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(membership =>
            membership.OrganizationId == organizationId && membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject, cancellationToken);
        return isOwner ? await database.Organizations.SingleOrDefaultAsync(item => item.Id == organizationId, cancellationToken) : null;
    }

    public async Task<IReadOnlyList<TenantDto>?> ListRestaurantsOwnedAsync(Guid organizationId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await database.OrganizationOwnerMemberships.AsNoTracking().AnyAsync(membership =>
            membership.OrganizationId == organizationId && membership.Issuer == identity.Issuer &&
            membership.Subject == identity.Subject, cancellationToken)) return null;
        return await database.Tenants.AsNoTracking().Where(tenant => tenant.OrganizationId == organizationId)
            .OrderBy(tenant => tenant.Name).Select(tenant => new TenantDto(tenant.Id, tenant.OrganizationId,
                tenant.Name, tenant.Subdomain.Value, tenant.Currency)).ToListAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) => database.SaveChangesAsync(cancellationToken);

    public async Task CreateAsync(Organization organization, OrganizationOwnerMembership owner,
        CancellationToken cancellationToken)
    {
        database.Organizations.Add(organization);
        database.OrganizationOwnerMemberships.Add(owner);
        await database.SaveChangesAsync(cancellationToken);
    }
}
