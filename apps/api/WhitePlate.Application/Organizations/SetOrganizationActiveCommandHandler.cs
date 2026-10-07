using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Organizations;

public sealed class SetOrganizationActiveCommandHandler(IOrganizationRepository organizations)
{
    public async Task<Result<OrganizationDto>> HandleAsync(Guid organizationId, bool isActive,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        var organization = await organizations.FindOwnedAsync(organizationId, identity, cancellationToken);
        if (organization is null)
            return Result<OrganizationDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        if (organization.IsActive != isActive)
        {
            if (isActive) organization.Reactivate();
            else organization.Deactivate();
            await organizations.SaveChangesAsync(cancellationToken);
        }

        return Result<OrganizationDto>.Success(OrganizationDto.FromDomain(organization));
    }
}
