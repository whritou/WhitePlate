using WhitePlate.Domain.Organizations;

namespace WhitePlate.Application.Organizations;

public sealed record OrganizationDto(Guid Id, string Name, bool IsActive, string? LegalCountryCode = null,
    string? LegalName = null, string? LegalRegistrationNumber = null, string? TaxIdentifier = null,
    int LegalProfileVersion = 1)
{
    public static OrganizationDto FromDomain(Organization organization) =>
        new(organization.Id, organization.Name, organization.IsActive, organization.LegalCountryCode,
            organization.LegalName, organization.LegalRegistrationNumber, organization.TaxIdentifier,
            organization.LegalProfileVersion);
}
