using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Organizations;

public sealed class RenameOrganizationCommandHandler(IOrganizationRepository organizations)
{
    public async Task<Result<OrganizationDto>> HandleAsync(Guid organizationId, string? name,
        ExternalIdentity identity, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        var organization = await organizations.FindOwnedAsync(organizationId, identity, cancellationToken);
        if (organization is null) return Result<OrganizationDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            organization.Rename(name);
        }
        catch (DomainRuleException exception)
        {
            return Result<OrganizationDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }

        await organizations.SaveChangesAsync(cancellationToken);
        return Result<OrganizationDto>.Success(OrganizationDto.FromDomain(organization));
    }
}
