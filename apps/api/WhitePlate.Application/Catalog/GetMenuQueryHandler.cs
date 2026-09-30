using WhitePlate.Application.Tenants;

namespace WhitePlate.Application.Catalog;

public sealed class GetMenuQueryHandler(ICatalogRepository catalog)
{
    public Task<MenuDto> HandleAsync(TenantDto tenant, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(tenant);
        cancellationToken.ThrowIfCancellationRequested();
        return catalog.GetMenuAsync(tenant, cancellationToken);
    }
}
