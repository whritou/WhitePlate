using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed record TenantDto(Guid Id, Guid OrganizationId, string Name, string Subdomain, string Currency)
{
    public string DefaultMenuLocale { get; init; } = "en";
    public IReadOnlyList<string> MenuLocales { get; init; } = ["en"];

    public static TenantDto FromDomain(Tenant tenant) =>
        new(tenant.Id, tenant.OrganizationId, tenant.Name, tenant.Subdomain.Value, tenant.Currency)
        {
            DefaultMenuLocale = tenant.DefaultMenuLocale,
            MenuLocales = tenant.GetMenuLocales()
        };
}
