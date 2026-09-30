using WhitePlate.Application.Tenants;

namespace WhitePlate.Api.Tenancy;

public sealed class CurrentTenant : ICurrentTenant
{
    public TenantDto? Tenant { get; private set; }

    public void Set(TenantDto tenant)
    {
        if (Tenant is not null)
        {
            throw new InvalidOperationException("The tenant has already been resolved for this request.");
        }

        Tenant = tenant;
    }
}
