using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed class CreateRestaurantCommandHandler(IStaffMembershipRepository memberships, ITenantRepository tenants)
{
    private static readonly HashSet<string> ReservedSubdomains = new(StringComparer.Ordinal)
    {
        "www", "api", "admin", "app"
    };

    public async Task<Result<TenantDto>> HandleAsync(CreateRestaurantCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();
        if (!await memberships.IsOrganizationOwnerAsync(command.OrganizationId, command.Identity, cancellationToken))
        {
            return Result<TenantDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        }

        Tenant tenant;
        try
        {
            tenant = Tenant.Create(command.OrganizationId, command.Name, command.Subdomain, command.Currency);
        }
        catch (DomainRuleException exception)
        {
            return Result<TenantDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }

        if (ReservedSubdomains.Contains(tenant.Subdomain.Value))
        {
            return Result<TenantDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("subdomain", "reserved_subdomain", "This subdomain is reserved.")));
        }

        return await tenants.TryAddAsync(tenant, cancellationToken)
            ? Result<TenantDto>.Success(TenantDto.FromDomain(tenant))
            : Result<TenantDto>.Failure(new ApplicationError(ErrorCode.Conflict));
    }
}
