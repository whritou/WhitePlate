using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed record TenantDto(Guid Id, Guid OrganizationId, string Name, string Subdomain, string Currency)
{
    public static TenantDto FromDomain(Tenant tenant) =>
        new(tenant.Id, tenant.OrganizationId, tenant.Name, tenant.Subdomain.Value, tenant.Currency);
}
