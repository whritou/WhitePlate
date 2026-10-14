using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Application.Tenants;

public sealed record OrderingOperationsDto(bool AcceptingOrders, bool RushHoldEnabled,
    int RushBufferMinutes, int Version);

public sealed record UpdateOrderingOperationsInput(bool AcceptingOrders, bool RushHoldEnabled);

public interface IOrderingOperationsRepository
{
    Task<Tenant?> GetAsync(Guid tenantId, CancellationToken cancellationToken);

    Task<bool> SaveAsync(Tenant tenant, ExternalIdentity identity, int expectedVersion,
        CancellationToken cancellationToken);
}

public sealed class OrderingOperationsHandler(IStaffMembershipRepository memberships,
    IOrderingOperationsRepository repository)
{
    public async Task<Result<OrderingOperationsDto>> GetAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        if (!await OrderStaffAccess.CanViewAsync(memberships, tenantId, identity, cancellationToken))
            return Missing();

        var tenant = await repository.GetAsync(tenantId, cancellationToken);
        return tenant is null
            ? Missing()
            : Result<OrderingOperationsDto>.Success(ToDto(tenant));
    }

    public async Task<Result<OrderingOperationsDto>> UpdateAsync(Guid tenantId, ExternalIdentity identity,
        UpdateOrderingOperationsInput input, int? expectedVersion, CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(tenantId, identity, cancellationToken)) return Missing();

        var tenant = await repository.GetAsync(tenantId, cancellationToken);
        if (tenant is null) return Missing();
        if (expectedVersion is null)
            return Result<OrderingOperationsDto>.Failure(new ApplicationError(ErrorCode.PreconditionRequired));
        if (tenant.OrderingOperationsVersion != expectedVersion)
            return Result<OrderingOperationsDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed));

        try
        {
            tenant.SetOrderingOperations(input.AcceptingOrders, input.RushHoldEnabled);
            if (!await repository.SaveAsync(tenant, identity, expectedVersion.Value, cancellationToken))
                return await CanManageAsync(tenantId, identity, cancellationToken)
                    ? Result<OrderingOperationsDto>.Failure(new ApplicationError(ErrorCode.PreconditionFailed))
                    : Missing();

            return Result<OrderingOperationsDto>.Success(ToDto(tenant));
        }
        catch (DomainRuleException exception)
        {
            return Result<OrderingOperationsDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }

    private async Task<bool> CanManageAsync(Guid tenantId, ExternalIdentity identity,
        CancellationToken cancellationToken) =>
        await memberships.IsOrganizationOwnerOfTenantAsync(tenantId, identity, cancellationToken) ||
        await memberships.HasRestaurantRoleAsync(tenantId, identity, RestaurantRole.Manager, cancellationToken);

    private static OrderingOperationsDto ToDto(Tenant tenant) => new(tenant.AcceptingOrders,
        tenant.RushHoldEnabled, tenant.RushHoldEnabled ? Tenant.RushHoldBufferMinutes : 0,
        tenant.OrderingOperationsVersion);

    private static Result<OrderingOperationsDto> Missing() =>
        Result<OrderingOperationsDto>.Failure(new ApplicationError(ErrorCode.NotFound));
}
