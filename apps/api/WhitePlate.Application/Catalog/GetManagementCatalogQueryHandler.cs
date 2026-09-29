using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed record GetManagementCatalogQuery(Guid TenantId, ExternalIdentity Identity);

public sealed class GetManagementCatalogQueryHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<CatalogManagementDto>> HandleAsync(GetManagementCatalogQuery query,
        CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, query.TenantId, query.Identity, cancellationToken))
            return Result<CatalogManagementDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        var result = await catalog.GetManagementCatalogAsync(query.TenantId, cancellationToken);
        return result is null
            ? Result<CatalogManagementDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<CatalogManagementDto>.Success(result);
    }
}
