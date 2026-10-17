using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Catalog;

public sealed record CreateCategoryCommand(Guid TenantId, string Name, int SortOrder, ExternalIdentity Identity);

public sealed class CreateCategoryCommandHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<MenuCategoryDto>> HandleAsync(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();
        if (!await CatalogAccess.CanManageAsync(memberships, command.TenantId, command.Identity, cancellationToken))
            return Result<MenuCategoryDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var category = MenuCategory.Create(command.TenantId, command.Name, command.SortOrder);
            return Result<MenuCategoryDto>.Success(await catalog.AddCategoryAsync(category, cancellationToken));
        }
        catch (DomainRuleException exception)
        {
            return Result<MenuCategoryDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }
}

internal static class CatalogAccess
{
    public static Task<bool> CanManageAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.CatalogManage, cancellationToken);

    public static Task<bool> CanManageDiscountsAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        memberships.HasPermissionAsync(tenantId, identity, RestaurantPermission.DiscountsManage, cancellationToken);

    public static Task<bool> CanManageAvailabilityAsync(IStaffMembershipRepository memberships, Guid tenantId,
        ExternalIdentity identity, CancellationToken cancellationToken) =>
        RestaurantPermissionAccess.HasAnyAsync(memberships, tenantId, identity, cancellationToken,
            RestaurantPermission.CatalogManage, RestaurantPermission.KitchenDisplay);
}
