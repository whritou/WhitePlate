using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public sealed class AcceptStaffInvitationCommandHandler(IStaffInvitationRepository invitations, TimeProvider timeProvider)
{
    public async Task<Result<bool>> HandleAsync(string? token, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        if (string.IsNullOrWhiteSpace(token) || token.Length != 64 || !token.All(Uri.IsHexDigit))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));

        var accepted = await invitations.AcceptAsync(InvitationToken.Hash(token), identity, timeProvider.GetUtcNow(),
            cancellationToken);
        return accepted
            ? Result<bool>.Success(true)
            : Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
    }
}
