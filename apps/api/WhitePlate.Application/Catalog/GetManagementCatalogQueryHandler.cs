using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Catalog;

public sealed record GetManagementCatalogQuery(Guid TenantId, ExternalIdentity Identity);

public sealed class GetManagementCatalogQueryHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<CatalogManagementDto>> HandleAsync(GetManagementCatalogQuery query,
        CancellationToken cancellationToken)
    {
        var canManageCatalog = await memberships.HasPermissionAsync(query.TenantId, query.Identity,
            RestaurantPermission.CatalogManage, cancellationToken);
        var canManageDiscounts = await memberships.HasPermissionAsync(query.TenantId, query.Identity,
            RestaurantPermission.DiscountsManage, cancellationToken);
        if (!canManageCatalog && !canManageDiscounts)
            return Result<CatalogManagementDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var result = await catalog.GetManagementCatalogAsync(query.TenantId, cancellationToken);
        if (result is null) return Result<CatalogManagementDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (!canManageCatalog)
            result = result with { Categories = [], Products = [], OptionGroups = [], Options = [] };
        if (!canManageDiscounts) result = result with { Discounts = [] };
        return Result<CatalogManagementDto>.Success(result);
    }
}
