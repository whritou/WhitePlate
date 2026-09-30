using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Identity;

public sealed class GetCurrentUserQueryHandler(IStaffDirectoryRepository directory)
{
    public Task<CurrentUserDto> HandleAsync(ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        return directory.GetAsync(identity, cancellationToken);
    }
}
