namespace WhitePlate.Application.Tenants;

// Selection of public tenant data is not evidence of authenticated membership.
public interface ICurrentTenant
{
    TenantDto? Tenant { get; }
}
