using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Identity;

public enum InvitationRole
{
    OrganizationOwner = 1,
    RestaurantManager = 2,
    KitchenStaff = 3
}

public sealed class StaffInvitation
{
    public Guid Id { get; private set; }
    public Guid OrganizationId { get; private set; }
    public Guid? TenantId { get; private set; }
    public InvitationRole Role { get; private set; }
    public string? RecipientEmail { get; private set; }
    public string TokenHash { get; private set; } = null!;
    public DateTimeOffset ExpiresAt { get; private set; }
    public bool IsRevoked { get; private set; }
    public string? AcceptedIssuer { get; private set; }
    public string? AcceptedSubject { get; private set; }

    private StaffInvitation() { }

    public static StaffInvitation Create(Guid organizationId, Guid? tenantId, InvitationRole role,
        string? recipientEmail, string? tokenHash, DateTimeOffset expiresAt, DateTimeOffset now)
    {
        if (organizationId == Guid.Empty)
            throw new DomainRuleException("invalid_organization", "organizationId", "An organization is required.");
        if (!Enum.IsDefined(role))
            throw new DomainRuleException("invalid_role", "role", "Invitation role is not supported.");
        if ((role == InvitationRole.OrganizationOwner) != (tenantId is null) || tenantId == Guid.Empty)
            throw new DomainRuleException("invalid_invitation_scope", "tenantId", "Invitation role and restaurant scope do not match.");
        var email = recipientEmail?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || email.Length > 254 || email.Contains(' ') ||
            email.Count(character => character == '@') != 1 || email[0] == '@' || email[^1] == '@')
            throw new DomainRuleException("invalid_email", "email", "Email address is invalid.");
        if (string.IsNullOrWhiteSpace(tokenHash) || tokenHash.Length != 64 || !tokenHash.All(Uri.IsHexDigit))
            throw new DomainRuleException("invalid_invitation_token", "token", "Invitation token is invalid.");
        if (expiresAt <= now)
            throw new DomainRuleException("invalid_expiry", "expiresAt", "Invitation expiry must be in the future.");

        return new StaffInvitation
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            TenantId = tenantId,
            Role = role,
            RecipientEmail = email,
            TokenHash = tokenHash.ToLowerInvariant(),
            ExpiresAt = expiresAt
        };
    }

    public bool TryAccept(ExternalIdentity identity, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(identity);
        if (IsRevoked || AcceptedSubject is not null || now >= ExpiresAt || RecipientEmail is null || !identity.EmailVerified ||
            !string.Equals(RecipientEmail, identity.Email, StringComparison.Ordinal)) return false;
        AcceptedIssuer = identity.Issuer;
        AcceptedSubject = identity.Subject;
        return true;
    }

    public bool TryRevoke(DateTimeOffset now)
    {
        if (IsRevoked || AcceptedSubject is not null || now >= ExpiresAt) return false;

        IsRevoked = true;
        return true;
    }
}
