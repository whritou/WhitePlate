using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;
using System.Text;
using System.Text.RegularExpressions;

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
    public string RoleId { get; private set; } = null!;
    public RestaurantRole Role { get; private set; }
    public string Name { get; private set; } = null!;
    public string NormalizedName { get; private set; } = null!;
    public bool IsArchived { get; private set; }
    public RestaurantPermission Permissions { get; private set; }
    public int Version { get; private set; }
    public string? BuiltInKey => string.Equals(RoleId, Role.ToString(), StringComparison.Ordinal)
        ? Role.ToString()
        : null;
    public bool IsBuiltIn => BuiltInKey is not null;
    public IReadOnlyList<string> PermissionKeys => RestaurantPermissionCatalog.ToKeys(Permissions);

    private static readonly HashSet<string> ReservedNames = new(StringComparer.Ordinal)
    {
        "MANAGER", "KITCHEN", "KITCHEN STAFF", "STAFF", "ACCOUNTANT", "OWNER", "ORGANIZATIONOWNER"
    };

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
            RoleId = role.ToString(),
            Role = role,
            Name = DefaultName(role),
            NormalizedName = NormalizeName(DefaultName(role)),
            Permissions = RestaurantPermissionCatalog.ParseKeys(permissionKeys),
            Version = version
        };
    }

    public static OrganizationRoleGrantSet CreateCustom(Guid organizationId, string? name,
        IEnumerable<string> permissionKeys)
    {
        if (organizationId == Guid.Empty)
            throw new DomainRuleException("invalid_organization", "organizationId", "An organization is required.");
        var displayName = ValidateName(name);
        var normalizedName = NormalizeName(displayName);
        if (ReservedNames.Contains(normalizedName))
            throw new DomainRuleException("reserved_role_name", "name", "This role name is reserved.");

        return new OrganizationRoleGrantSet
        {
            OrganizationId = organizationId,
            RoleId = Guid.NewGuid().ToString("N"),
            Role = RestaurantRole.Staff,
            Name = displayName,
            NormalizedName = normalizedName,
            Permissions = RestaurantPermissionCatalog.ParseKeys(permissionKeys),
            Version = 1
        };
    }

    public static OrganizationRoleGrantSet CreateDefault(Guid organizationId, RestaurantRole role) =>
        Create(organizationId, role, RestaurantPermissionCatalog.ToKeys(DefaultPermissions(role)));

    public bool Has(RestaurantPermission permission) => (Permissions & permission) == permission;

    public void Replace(IEnumerable<string> permissionKeys, int expectedVersion)
    {
        Update(null, permissionKeys, expectedVersion);
    }

    public void Update(string? name, IEnumerable<string> permissionKeys, int expectedVersion)
    {
        EnsureVersion(expectedVersion);
        if (name is not null)
        {
            if (IsBuiltIn)
            {
                if (!string.Equals(name.Trim(), Name, StringComparison.Ordinal))
                    throw new DomainRuleException("fixed_role_name", "name", "Built-in role names cannot be changed.");
            }
            else
            {
                var displayName = ValidateName(name);
                var normalizedName = NormalizeName(displayName);
                if (ReservedNames.Contains(normalizedName))
                    throw new DomainRuleException("reserved_role_name", "name", "This role name is reserved.");
                Name = displayName;
                NormalizedName = normalizedName;
            }
        }
        if (IsArchived)
            throw new DomainRuleException("archived_role", "roleId", "Archived roles cannot be changed.");
        Permissions = RestaurantPermissionCatalog.ParseKeys(permissionKeys);
        Version++;
    }

    public void Archive(int expectedVersion)
    {
        EnsureVersion(expectedVersion);
        if (IsBuiltIn)
            throw new DomainRuleException("protected_role", "roleId", "Built-in roles cannot be archived.");
        if (IsArchived)
            throw new DomainRuleException("archived_role", "roleId", "This role is already archived.");
        IsArchived = true;
        Version++;
    }

    public static string NormalizeName(string value) => Regex.Replace(
        value.Normalize(NormalizationForm.FormKC).Trim(), @"\s+", " ").ToUpperInvariant();

    private static string ValidateName(string? value)
    {
        var displayName = Regex.Replace((value ?? string.Empty).Normalize(NormalizationForm.FormKC).Trim(), @"\s+", " ");
        if (displayName.Length is < 1 or > 60 || displayName.Any(char.IsControl))
            throw new DomainRuleException("invalid_role_name", "name", "Role name must contain 1 to 60 valid characters.");
        return displayName;
    }

    private void EnsureVersion(int expectedVersion)
    {
        if (expectedVersion != Version)
            throw new DomainRuleException("role_grant_version_conflict", "version", "Role grants have changed. Reload and try again.");
    }

    private static string DefaultName(RestaurantRole role) => role switch
    {
        RestaurantRole.Manager => "Manager",
        RestaurantRole.Kitchen => "Kitchen staff",
        RestaurantRole.Staff => "Staff",
        RestaurantRole.Accountant => "Accountant",
        _ => throw new DomainRuleException("invalid_role", "role", "Restaurant role is not supported.")
    };

    private static RestaurantPermission DefaultPermissions(RestaurantRole role) => role switch
    {
        RestaurantRole.Manager => RestaurantPermission.All & ~RestaurantPermission.BillingManage,
        RestaurantRole.Staff => RestaurantPermission.OrdersManage | RestaurantPermission.KitchenDisplay,
        RestaurantRole.Kitchen => RestaurantPermission.KitchenDisplay,
        RestaurantRole.Accountant => RestaurantPermission.AnalyticsView | RestaurantPermission.BillingManage,
        _ => throw new DomainRuleException("invalid_role", "role", "Restaurant role is not supported.")
    };
}
