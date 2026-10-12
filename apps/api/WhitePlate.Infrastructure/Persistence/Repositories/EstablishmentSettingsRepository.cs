using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Tenants;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Infrastructure.Persistence.Repositories;

public sealed class EstablishmentSettingsRepository(WhitePlateDbContext database) : IEstablishmentSettingsRepository
{
    private IQueryable<Tenant> Active(Guid id) => database.Tenants.Where(row => row.Id == id && row.IsActive &&
        database.Organizations.Any(organization => organization.Id == row.OrganizationId && organization.IsActive));

    public Task<Tenant?> GetAsync(Guid tenantId, CancellationToken cancellationToken) =>
        Active(tenantId).AsNoTracking().SingleOrDefaultAsync(cancellationToken);

    public async Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion, string expectedLocales,
        string expectedDefaultLocale, CancellationToken cancellationToken) =>
        await Active(tenant.Id).Where(row => (database.OrganizationOwnerMemberships.Any(membership =>
                membership.OrganizationId == row.OrganizationId && membership.Issuer == identity.Issuer && membership.Subject == identity.Subject) ||
            database.RestaurantMemberships.Any(membership => membership.TenantId == row.Id && membership.Role == RestaurantRole.Manager &&
                membership.Issuer == identity.Issuer && membership.Subject == identity.Subject)) && row.EstablishmentVersion == expectedVersion &&
            row.MenuLocalesJson == expectedLocales && row.DefaultMenuLocale == expectedDefaultLocale)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(row => row.Name, tenant.Name).SetProperty(row => row.Phone, tenant.Phone)
                .SetProperty(row => row.AddressLine1, tenant.AddressLine1).SetProperty(row => row.AddressLine2, tenant.AddressLine2)
                .SetProperty(row => row.PostalCode, tenant.PostalCode).SetProperty(row => row.City, tenant.City)
                .SetProperty(row => row.Region, tenant.Region).SetProperty(row => row.CountryCode, tenant.CountryCode)
                .SetProperty(row => row.Latitude, tenant.Latitude).SetProperty(row => row.Longitude, tenant.Longitude)
                .SetProperty(row => row.TimeZone, tenant.TimeZone).SetProperty(row => row.PickupInstructionsJson, tenant.PickupInstructionsJson)
                .SetProperty(row => row.OpeningHoursJson, tenant.OpeningHoursJson)
                .SetProperty(row => row.EstablishmentVersion, tenant.EstablishmentVersion), cancellationToken) == 1;
}
