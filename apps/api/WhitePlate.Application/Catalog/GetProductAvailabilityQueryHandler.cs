using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed record GetProductAvailabilityQuery(Guid TenantId, ExternalIdentity Identity);

public sealed class GetProductAvailabilityQueryHandler(
    IStaffMembershipRepository memberships,
    ICatalogRepository catalog)
{
    public async Task<Result<IReadOnlyList<ProductAvailabilityDto>>> HandleAsync(
        GetProductAvailabilityQuery query, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAvailabilityAsync(memberships, query.TenantId, query.Identity,
                cancellationToken))
            return Result<IReadOnlyList<ProductAvailabilityDto>>.Failure(new ApplicationError(ErrorCode.NotFound));

        return Result<IReadOnlyList<ProductAvailabilityDto>>.Success(
            await catalog.GetProductAvailabilityAsync(query.TenantId, cancellationToken));
    }
}
