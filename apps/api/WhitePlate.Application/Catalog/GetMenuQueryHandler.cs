using WhitePlate.Application.Tenants;

namespace WhitePlate.Application.Catalog;

public sealed class GetMenuQueryHandler(ICatalogRepository catalog)
{
    public Task<MenuDto> HandleAsync(TenantDto tenant, CancellationToken cancellationToken) =>
        HandleAsync(tenant, null, cancellationToken);

    public Task<MenuDto> HandleAsync(TenantDto tenant, string? locale, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenant);
        cancellationToken.ThrowIfCancellationRequested();
        return catalog.GetMenuAsync(tenant, locale, cancellationToken);
    }
}
