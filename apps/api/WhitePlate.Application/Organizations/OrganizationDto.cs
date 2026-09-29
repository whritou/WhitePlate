using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Organizations;

public sealed record OrganizationDto(Guid Id, string Name)
{
    public static OrganizationDto FromDomain(Organization organization) => new(organization.Id, organization.Name);
}
