using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public sealed class RevokeStaffInvitationCommandHandler(IStaffInvitationRepository invitations)
{
    public async Task<Result<bool>> HandleAsync(Guid organizationId, Guid invitationId, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        return await invitations.RevokeAsync(organizationId, invitationId, identity, cancellationToken)
            ? Result<bool>.Success(true)
            : Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
    }
}
