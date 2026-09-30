using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Domain.Tenants;

public enum RestaurantRole
{
    Manager = 1,
    Kitchen = 2
}

public sealed class RestaurantMembership
{
    public Guid TenantId { get; private set; }
    public string Issuer { get; private set; } = null!;
    public string Subject { get; private set; } = null!;
    public RestaurantRole Role { get; private set; }
    public ExternalIdentity Identity => ExternalIdentity.Create(Issuer, Subject);

    private RestaurantMembership() { }

    public static RestaurantMembership Create(Guid tenantId, ExternalIdentity identity, RestaurantRole role)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (tenantId == Guid.Empty)
        {
            throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        }

        if (!Enum.IsDefined(role))
        {
            throw new DomainRuleException("invalid_role", "role", "Restaurant role is not supported.");
        }

        return new RestaurantMembership
        {
            TenantId = tenantId,
            Issuer = identity.Issuer,
            Subject = identity.Subject,
            Role = role
        };
    }
}
