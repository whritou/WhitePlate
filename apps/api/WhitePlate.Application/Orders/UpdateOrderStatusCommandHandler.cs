using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Application.Orders;

public sealed class UpdateOrderStatusCommandHandler(IOrderRepository orders, IStaffMembershipRepository memberships,
    TimeProvider timeProvider)
{
    public async Task<Result<OrderReceiptDto>> HandleAsync(UpdateOrderStatusCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        ArgumentNullException.ThrowIfNull(command.Identity);
        cancellationToken.ThrowIfCancellationRequested();
        if (command.TenantId == Guid.Empty || command.OrderId == Guid.Empty || command.ExpectedVersion < 1 ||
            !Enum.IsDefined(command.Status))
            return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("status", "invalid_value", "The order status request is invalid.")));

        var canUpdate = command.Status == OrderStatus.Cancelled
            ? await OrderStaffAccess.CanCancelAsync(memberships, command.TenantId, command.Identity, cancellationToken)
            : await OrderStaffAccess.CanViewAsync(memberships, command.TenantId, command.Identity, cancellationToken);
        if (!canUpdate) return Result<OrderReceiptDto>.Failure(new ApplicationError(ErrorCode.Forbidden));

        return await orders.TransitionAsync(command.TenantId, command.OrderId, command.ExpectedVersion,
            command.Status, timeProvider.GetUtcNow(), cancellationToken);
    }
}
