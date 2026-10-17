using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Domain.Organizations;

[Flags]
public enum RestaurantPermission : long
{
    None = 0,
    OrdersManage = 1L << 0,
    KitchenDisplay = 1L << 1,
    CatalogManage = 1L << 2,
    DiscountsManage = 1L << 3,
    AnalyticsView = 1L << 4,
    StorefrontManage = 1L << 5,
    StaffManage = 1L << 6,
    BillingManage = 1L << 7,
    All = OrdersManage | KitchenDisplay | CatalogManage | DiscountsManage | AnalyticsView |
          StorefrontManage | StaffManage | BillingManage
}

public static class RestaurantPermissionCatalog
{
    public const string OrdersManage = "orders.manage";
    public const string KitchenDisplay = "kitchen.display";
    public const string CatalogManage = "catalog.manage";
    public const string DiscountsManage = "discounts.manage";
    public const string AnalyticsView = "analytics.view";
    public const string StorefrontManage = "storefront.manage";
    public const string StaffManage = "staff.manage";
    public const string BillingManage = "billing.manage";
    private static readonly (RestaurantPermission Permission, string Key)[] Entries =
    [
        (RestaurantPermission.OrdersManage, OrdersManage),
        (RestaurantPermission.KitchenDisplay, KitchenDisplay),
        (RestaurantPermission.CatalogManage, CatalogManage),
        (RestaurantPermission.DiscountsManage, DiscountsManage),
        (RestaurantPermission.AnalyticsView, AnalyticsView),
        (RestaurantPermission.StorefrontManage, StorefrontManage),
        (RestaurantPermission.StaffManage, StaffManage),
        (RestaurantPermission.BillingManage, BillingManage)
    ];

    public static IReadOnlyList<string> Keys { get; } = Array.AsReadOnly(Entries.Select(entry => entry.Key).ToArray());

    public static bool TryParse(string? key, out RestaurantPermission permission)
    {
        var entry = Entries.FirstOrDefault(item => string.Equals(item.Key, key, StringComparison.Ordinal));
        permission = entry.Permission;
        return entry.Key is not null;
    }

    public static string ToKey(RestaurantPermission permission) =>
        Entries.FirstOrDefault(entry => entry.Permission == permission).Key ??
        throw new ArgumentOutOfRangeException(nameof(permission));

    public static IReadOnlyList<string> ToKeys(RestaurantPermission permissions) => Array.AsReadOnly(
        Entries.Where(entry => (permissions & entry.Permission) != 0).Select(entry => entry.Key).ToArray());

    public static RestaurantPermission ParseKeys(IEnumerable<string> keys)
    {
        ArgumentNullException.ThrowIfNull(keys);
        var permissions = RestaurantPermission.None;
        foreach (var key in keys)
        {
            if (!TryParse(key, out var permission))
                throw new DomainRuleException("invalid_permission", "permissions", "Permission is not supported.");
            if ((permissions & permission) != 0)
                throw new DomainRuleException("duplicate_permission", "permissions", "Permissions must be unique.");
            permissions |= permission;
        }
        return permissions;
    }
}

public sealed class OrganizationRoleGrantSet
{
    public Guid OrganizationId { get; private set; }
    public RestaurantRole Role { get; private set; }
    public RestaurantPermission Permissions { get; private set; }
    public int Version { get; private set; }
    public IReadOnlyList<string> PermissionKeys => RestaurantPermissionCatalog.ToKeys(Permissions);

    private OrganizationRoleGrantSet() { }

    public static OrganizationRoleGrantSet Create(Guid organizationId, RestaurantRole role,
        IEnumerable<string> permissionKeys, int version = 1)
    {
        if (organizationId == Guid.Empty)
            throw new DomainRuleException("invalid_organization", "organizationId", "An organization is required.");
        if (!Enum.IsDefined(role))
            throw new DomainRuleException("invalid_role", "role", "Restaurant role is not supported.");
        if (version < 1)
            throw new DomainRuleException("invalid_version", "version", "Grant version must be positive.");

        return new OrganizationRoleGrantSet
        {
            OrganizationId = organizationId,
            Role = role,
            Permissions = RestaurantPermissionCatalog.ParseKeys(permissionKeys),
            Version = version
        };
    }

    public static OrganizationRoleGrantSet CreateDefault(Guid organizationId, RestaurantRole role) =>
        Create(organizationId, role, RestaurantPermissionCatalog.ToKeys(DefaultPermissions(role)));

    public bool Has(RestaurantPermission permission) => (Permissions & permission) == permission;

    public void Replace(IEnumerable<string> permissionKeys, int expectedVersion)
    {
        if (expectedVersion != Version)
            throw new DomainRuleException("role_grant_version_conflict", "version", "Role grants have changed. Reload and try again.");
        Permissions = RestaurantPermissionCatalog.ParseKeys(permissionKeys);
        Version++;
    }

    private static RestaurantPermission DefaultPermissions(RestaurantRole role) => role switch
    {
        RestaurantRole.Manager => RestaurantPermission.All & ~RestaurantPermission.BillingManage,
        RestaurantRole.Staff => RestaurantPermission.OrdersManage | RestaurantPermission.KitchenDisplay,
        RestaurantRole.Kitchen => RestaurantPermission.KitchenDisplay,
        RestaurantRole.Accountant => RestaurantPermission.AnalyticsView | RestaurantPermission.BillingManage,
        _ => throw new DomainRuleException("invalid_role", "role", "Restaurant role is not supported.")
    };
}
