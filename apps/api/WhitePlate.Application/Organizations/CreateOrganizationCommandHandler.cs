using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Organizations;

public sealed class CreateOrganizationCommandHandler(IOrganizationProvisioningRepository repository)
{
    public async Task<Result<OrganizationDto>> HandleAsync(string name, ExternalIdentity identity,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(identity);
        cancellationToken.ThrowIfCancellationRequested();
        if (!identity.EmailVerified || string.IsNullOrWhiteSpace(identity.Email))
            return Result<OrganizationDto>.Failure(new ApplicationError(ErrorCode.Forbidden));
        try
        {
            var organization = Organization.Create(name);
            var owner = OrganizationOwnerMembership.Create(organization.Id, identity);
            await repository.CreateAsync(organization, owner, cancellationToken);
            return Result<OrganizationDto>.Success(OrganizationDto.FromDomain(organization));
        }
        catch (DomainRuleException exception)
        {
            return Result<OrganizationDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }
}
