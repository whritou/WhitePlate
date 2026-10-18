using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Organizations;

public sealed record OrganizationRoleGrantDto(string Role, string Name, string? BuiltInKey,
    IReadOnlyList<string> Permissions, int Version, bool IsProtected, bool IsBuiltIn, bool IsArchived);

public sealed record OrganizationRoleAssignmentOptionDto(string Role, string Name, string? BuiltInKey);

public sealed class OrganizationRolePermissionsHandler(IStaffMembershipRepository memberships,
    IOrganizationRoleGrantRepository grants)
{
    private static readonly IReadOnlyList<OrganizationRoleGrantDto> ProtectedOwnerRole =
        [new("OrganizationOwner", "Owner", "OrganizationOwner", RestaurantPermissionCatalog.ToKeys(
            RestaurantPermission.All), 0, true, true, false)];

    public async Task<Result<IReadOnlyList<OrganizationRoleGrantDto>>> GetAsync(Guid organizationId,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<IReadOnlyList<OrganizationRoleGrantDto>>.Failure(new ApplicationError(ErrorCode.NotFound));

        var saved = await grants.ListAsync(organizationId, cancellationToken);
        var requiredRoles = new[] { RestaurantRole.Manager, RestaurantRole.Kitchen, RestaurantRole.Accountant };
        if (requiredRoles.Any(role => saved.All(grant => grant.BuiltInKey != role.ToString())))
            return Result<IReadOnlyList<OrganizationRoleGrantDto>>.Failure(new ApplicationError(ErrorCode.Unavailable));

        var items = ProtectedOwnerRole.Concat(saved.OrderBy(grant => grant.Name, StringComparer.OrdinalIgnoreCase)
            .Select(ToDto)).ToArray();
        return Result<IReadOnlyList<OrganizationRoleGrantDto>>.Success(items);
    }

    public async Task<Result<IReadOnlyList<OrganizationRoleAssignmentOptionDto>>> GetAssignableAsync(
        Guid organizationId, ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        var isOwner = await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken);
        if (!isOwner && !await memberships.HasOrganizationPermissionAsync(organizationId, identity,
                RestaurantPermission.StaffManage, cancellationToken))
            return Result<IReadOnlyList<OrganizationRoleAssignmentOptionDto>>.Failure(new ApplicationError(ErrorCode.NotFound));

        var roles = await grants.ListAsync(organizationId, cancellationToken);
        return Result<IReadOnlyList<OrganizationRoleAssignmentOptionDto>>.Success(roles
            .Where(role => !role.IsArchived)
            .OrderBy(role => role.Name, StringComparer.OrdinalIgnoreCase)
            .Select(role => new OrganizationRoleAssignmentOptionDto(role.RoleId, role.Name, role.BuiltInKey))
            .ToArray());
    }

    public Task<Result<OrganizationRoleGrantDto>> ReplaceAsync(Guid organizationId, string? roleId,
        IReadOnlyList<string>? permissionKeys, int expectedVersion, ExternalIdentity identity,
        CancellationToken cancellationToken) => UpdateAsync(organizationId, roleId, null, permissionKeys,
        expectedVersion, identity, cancellationToken);

    public async Task<Result<OrganizationRoleGrantDto>> UpdateAsync(Guid organizationId, string? roleId,
        string? name, IReadOnlyList<string>? permissionKeys, int expectedVersion, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (string.IsNullOrWhiteSpace(roleId) || roleId == "OrganizationOwner")
            return Validation("role", "invalid_role", "This role cannot be edited.");
        if (permissionKeys is null || expectedVersion < 1)
            return Validation("permissions", "invalid_role_grants", "Role permissions and version are required.");

        var grant = await grants.GetByIdAsync(organizationId, roleId, cancellationToken);
        if (grant is null || grant.IsArchived)
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            if (name is not null)
            {
                var normalizedName = OrganizationRoleGrantSet.NormalizeName(name);
                if (await grants.NameExistsAsync(organizationId, normalizedName, roleId, cancellationToken))
                    return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.Conflict));
            }
            grant.Update(name, permissionKeys, expectedVersion);
        }
        catch (DomainRuleException exception)
        {
            return MapDomainError<OrganizationRoleGrantDto>(exception);
        }

        if (!await grants.SaveAsync(grant, cancellationToken))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
        return Result<OrganizationRoleGrantDto>.Success(ToDto(grant));
    }

    public async Task<Result<OrganizationRoleGrantDto>> CreateAsync(Guid organizationId, string? name,
        IReadOnlyList<string>? permissionKeys, ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (permissionKeys is null)
            return Validation("permissions", "invalid_role_grants", "Role permissions are required.");

        OrganizationRoleGrantSet grant;
        try
        {
            grant = OrganizationRoleGrantSet.CreateCustom(organizationId, name, permissionKeys);
            if (await grants.NameExistsAsync(organizationId, grant.NormalizedName, null, cancellationToken))
                return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.Conflict));
        }
        catch (DomainRuleException exception)
        {
            return MapDomainError<OrganizationRoleGrantDto>(exception);
        }

        if (!await grants.AddAsync(grant, cancellationToken))
            return Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.Conflict));
        return Result<OrganizationRoleGrantDto>.Success(ToDto(grant));
    }

    public async Task<Result<bool>> ArchiveAsync(Guid organizationId, string? roleId, int expectedVersion,
        ExternalIdentity identity, DateTimeOffset now, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (string.IsNullOrWhiteSpace(roleId) || roleId == "OrganizationOwner" || expectedVersion < 1)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("roleId", "invalid_role", "This role cannot be archived.")));

        var grant = await grants.GetByIdAsync(organizationId, roleId, cancellationToken);
        if (grant is null) return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (await grants.HasActiveAssignmentsAsync(organizationId, roleId, now, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.Conflict));
        try
        {
            grant.Archive(expectedVersion);
        }
        catch (DomainRuleException exception)
        {
            return MapDomainError<bool>(exception);
        }

        return await grants.SaveAsync(grant, cancellationToken)
            ? Result<bool>.Success(true)
            : Result<bool>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));
    }

    private static OrganizationRoleGrantDto ToDto(OrganizationRoleGrantSet grant) =>
        new(grant.RoleId, grant.Name, grant.BuiltInKey, grant.PermissionKeys, grant.Version, false,
            grant.IsBuiltIn, grant.IsArchived);

    private static Result<OrganizationRoleGrantDto> Validation(string field, string code, string message) =>
        Result<OrganizationRoleGrantDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
            new ValidationIssue(field, code, message)));

    private static Result<T> MapDomainError<T>(DomainRuleException exception) =>
        exception.Code == "role_grant_version_conflict"
            ? Result<T>.Failure(new ApplicationError(ErrorCode.PreconditionFailed))
            : Result<T>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));

}
