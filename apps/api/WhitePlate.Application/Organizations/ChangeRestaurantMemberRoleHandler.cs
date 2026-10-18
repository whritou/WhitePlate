using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Organizations;

public sealed class ChangeRestaurantMemberRoleHandler(IStaffMembershipRepository memberships,
    IOrganizationRoleGrantRepository grants, IRestaurantMembershipRoleRepository assignments)
{
    public async Task<Result<bool>> HandleAsync(Guid organizationId, Guid memberId, string? roleId,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (!await memberships.IsOrganizationOwnerAsync(organizationId, identity, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (memberId == Guid.Empty || string.IsNullOrWhiteSpace(roleId) || roleId == "OrganizationOwner")
            return Result<bool>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("roleId", "invalid_role", "Select an active restaurant role.")));

        var role = await grants.GetByIdAsync(organizationId, roleId, cancellationToken);
        if (role is null || role.IsArchived)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        var updated = await assignments.ChangeRoleAsync(organizationId, memberId, role.RoleId, role.Role,
            cancellationToken);
        return updated
            ? Result<bool>.Success(true)
            : Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
    }
}
