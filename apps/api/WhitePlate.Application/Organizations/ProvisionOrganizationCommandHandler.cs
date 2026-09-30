using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Organizations;

public sealed class ProvisionOrganizationCommandHandler(IOrganizationProvisioningRepository repository)
{
    public async Task<Result<OrganizationDto>> HandleAsync(ProvisionOrganizationCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();
        Organization organization;
        OrganizationOwnerMembership owner;
        try
        {
            organization = Organization.Create(command.Name);
            owner = OrganizationOwnerMembership.Create(organization.Id,
                ExternalIdentity.Create(command.Issuer, command.Subject));
        }
        catch (DomainRuleException exception)
        {
            return Result<OrganizationDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }

        await repository.CreateAsync(organization, owner, cancellationToken);
        return Result<OrganizationDto>.Success(OrganizationDto.FromDomain(organization));
    }
}
