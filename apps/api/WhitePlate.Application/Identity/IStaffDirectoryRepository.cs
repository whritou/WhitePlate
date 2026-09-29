using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Identity;

public interface IStaffDirectoryRepository
{
    Task<CurrentUserDto> GetAsync(ExternalIdentity identity, CancellationToken cancellationToken);
}
