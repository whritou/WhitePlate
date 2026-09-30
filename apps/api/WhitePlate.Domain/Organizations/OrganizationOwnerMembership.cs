using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Domain.Organizations;

public sealed class OrganizationOwnerMembership
{
    public Guid OrganizationId { get; private set; }
    public string Issuer { get; private set; } = null!;
    public string Subject { get; private set; } = null!;
    public ExternalIdentity Identity => ExternalIdentity.Create(Issuer, Subject);

    private OrganizationOwnerMembership() { }

    public static OrganizationOwnerMembership Create(Guid organizationId, ExternalIdentity identity)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (organizationId == Guid.Empty)
        {
            throw new DomainRuleException("invalid_organization", "organizationId", "An organization is required.");
        }

        return new OrganizationOwnerMembership
        {
            OrganizationId = organizationId,
            Issuer = identity.Issuer,
            Subject = identity.Subject
        };
    }
}
