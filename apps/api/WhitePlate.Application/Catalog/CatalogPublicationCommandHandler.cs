using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed class CatalogPublicationCommandHandler(IStaffMembershipRepository memberships,
    ICatalogPublicationRepository catalog)
{
    public async Task<Result<CatalogHistoryDto>> GetHistoryAsync(Guid tenantId, int? beforeVersion, int pageSize,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<CatalogHistoryDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (pageSize is < 1 or > 100)
            return Result<CatalogHistoryDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("pageSize", "invalid_value", "History page size must be from 1 to 100.")));
        if (beforeVersion is < 1)
            return Result<CatalogHistoryDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("beforeVersion", "invalid_value", "The history cursor is invalid.")));

        var history = await catalog.GetHistoryAsync(tenantId, beforeVersion, pageSize, cancellationToken);
        return history is null
            ? Result<CatalogHistoryDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<CatalogHistoryDto>.Success(history);
    }

    public async Task<Result<CatalogPublicationResultDto>> PublishAsync(Guid tenantId, int? expectedVersion,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (expectedVersion is null)
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.PreconditionRequired));

        return await catalog.PublishAsync(tenantId, expectedVersion.Value, identity, cancellationToken);
    }

    public async Task<Result<bool>> DiscardAsync(Guid tenantId, int? expectedVersion, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (expectedVersion is null)
            return Result<bool>.Failure(new ApplicationError(ErrorCode.PreconditionRequired));

        return await catalog.DiscardAsync(tenantId, expectedVersion.Value, cancellationToken);
    }

    public async Task<Result<CatalogPublicationResultDto>> RestoreAsync(Guid tenantId, int? expectedVersion,
        int sourceVersion, ExternalIdentity identity, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken))
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        if (expectedVersion is null)
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.PreconditionRequired));
        if (sourceVersion < 1)
            return Result<CatalogPublicationResultDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("version", "invalid_value", "The catalog version is invalid.")));

        return await catalog.RestoreAsync(tenantId, expectedVersion.Value, sourceVersion,
            identity, cancellationToken);
    }
}
