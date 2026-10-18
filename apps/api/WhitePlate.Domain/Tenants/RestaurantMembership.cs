using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Domain.Tenants;

public enum RestaurantRole
{
    Manager = 1,
    Kitchen = 2,
    Staff = 3,
    Accountant = 4
}

public sealed class RestaurantMembership
{
    public Guid Id { get; private set; }
    public Guid? OrganizationId { get; private set; }
    public Guid TenantId { get; private set; }
    public string Issuer { get; private set; } = null!;
    public string Subject { get; private set; } = null!;
    public RestaurantRole Role { get; private set; }
    public string RoleId { get; private set; } = null!;
    public ExternalIdentity Identity => ExternalIdentity.Create(Issuer, Subject);

    private RestaurantMembership() { }

    public static RestaurantMembership Create(Guid tenantId, ExternalIdentity identity, RestaurantRole role)
        => Create(null, tenantId, identity, role.ToString(), role);

    public static RestaurantMembership Create(Guid organizationId, Guid tenantId, ExternalIdentity identity,
        string roleId, RestaurantRole compatibilityRole) => Create((Guid?)organizationId, tenantId, identity,
        roleId, compatibilityRole);

    private static RestaurantMembership Create(Guid? organizationId, Guid tenantId, ExternalIdentity identity,
        string roleId, RestaurantRole compatibilityRole)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (organizationId == Guid.Empty)
            throw new DomainRuleException("invalid_organization", "organizationId", "An organization is required.");
        if (tenantId == Guid.Empty)
        {
            throw new DomainRuleException("invalid_tenant", "tenantId", "A restaurant is required.");
        }

        if (!Enum.IsDefined(compatibilityRole))
        {
            throw new DomainRuleException("invalid_role", "role", "Restaurant role is not supported.");
        }
        if (string.IsNullOrWhiteSpace(roleId) || roleId.Length > 80)
            throw new DomainRuleException("invalid_role", "roleId", "Restaurant role is not supported.");

        return new RestaurantMembership
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            TenantId = tenantId,
            Issuer = identity.Issuer,
            Subject = identity.Subject,
            Role = compatibilityRole,
            RoleId = roleId
        };
    }

    public void ChangeRole(string roleId, RestaurantRole compatibilityRole)
    {
        if (string.IsNullOrWhiteSpace(roleId) || roleId.Length > 80 || !Enum.IsDefined(compatibilityRole))
            throw new DomainRuleException("invalid_role", "roleId", "Restaurant role is not supported.");
        RoleId = roleId;
        Role = compatibilityRole;
    }
}
