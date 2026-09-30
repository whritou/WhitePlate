using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed class ResolveTenantQueryHandler(ITenantRepository repository)
{
    public async Task<Result<TenantDto>> HandleAsync(ResolveTenantQuery query, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(query);
        cancellationToken.ThrowIfCancellationRequested();
        if (!TenantSubdomain.TryCreate(query.Subdomain, out var subdomain))
        {
            return Result<TenantDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        }

        var tenant = await repository.FindActiveBySubdomainAsync(subdomain!, cancellationToken);
        return tenant is null
            ? Result<TenantDto>.Failure(new ApplicationError(ErrorCode.NotFound))
            : Result<TenantDto>.Success(TenantDto.FromDomain(tenant));
    }
}
