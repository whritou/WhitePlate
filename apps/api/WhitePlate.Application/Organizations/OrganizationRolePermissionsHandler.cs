using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Organizations;

public sealed record OrganizationRoleGrantDto(string Role, IReadOnlyList<string> Permissions,
    int Version, bool IsProtected);

public sealed class OrganizationRolePermissionsHandler(IStaffMembershipRepository memberships,
    IOrganizationRoleGrantRepository grants)
{
    private static readonly IReadOnlyList<OrganizationRoleGrantDto> ProtectedOwnerRole =
        [new("OrganizationOwner", RestaurantPermissionCatalog.ToKeys(RestaurantPermission.All), 0, true)];

    public async Task<Result<IReadOnlyList<OrganizationRoleGrantDto>>> GetAsync(Guid organizationId,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<IReadOnlyList<OrganizationRoleGrantDto>>.Failure(new ApplicationError(ErrorCode.NotFound));

        var saved = await grants.ListAsync(organizationId, cancellationToken);
        var roles = Enum.GetValues<RestaurantRole>();
        if (saved.Count != roles.Length || roles.Any(role => saved.All(grant => grant.Role != role)))
            return Result<IReadOnlyList<OrganizationRoleGrantDto>>.Failure(new ApplicationError(ErrorCode.Unavailable));

        var items = ProtectedOwnerRole.Concat(saved.Select(ToDto)).ToArray();
        return Result<IReadOnlyList<OrganizationRoleGrantDto>>.Success(items);
    }

    public async Task<Result<OrganizationRoleGrantDto>> ReplaceAsync(Guid organizationId, string? roleName,
        IReadOnlyList<string>? permissionKeys, int expectedVersion, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        if (!TryParseEditableRole(roleName, out var role))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("role", "invalid_role", "This role cannot be edited.")));
        if (permissionKeys is null || expectedVersion < 1)
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("permissions", "invalid_role_grants", "Role permissions and version are required.")));

        var grant = await grants.GetAsync(organizationId, role, cancellationToken);
        if (grant is null)
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.Unavailable));
        try
        {
            grant.Replace(permissionKeys, expectedVersion);
        }
        catch (DomainRuleException exception)
        {
            if (exception.Code == "role_grant_version_conflict")
                return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }

        if (!await grants.SaveAsync(grant, cancellationToken))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
        return Result<OrganizationRoleGrantDto>.Success(ToDto(grant));
    }

    private static bool TryParseEditableRole(string? value, out RestaurantRole role)
    {
        role = value switch
        {
            "Manager" => RestaurantRole.Manager,
            "Staff" => RestaurantRole.Staff,
            "Kitchen" => RestaurantRole.Kitchen,
            "Accountant" => RestaurantRole.Accountant,
            _ => 0
        };
        return Enum.IsDefined(role);
    }

    private static OrganizationRoleGrantDto ToDto(OrganizationRoleGrantSet grant) =>
        new(grant.Role.ToString(), grant.PermissionKeys, grant.Version, false);
}
