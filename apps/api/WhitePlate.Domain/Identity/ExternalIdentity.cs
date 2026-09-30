using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Identity;

public sealed record ExternalIdentity
{
    public const int MaxIssuerLength = 500;
    public const int MaxSubjectLength = 200;

    public string Issuer { get; }
    public string Subject { get; }
    public string? Email { get; }
    public bool EmailVerified { get; }

    private ExternalIdentity(string issuer, string subject, string? email, bool emailVerified)
    {
        Issuer = issuer;
        Subject = subject;
        Email = email;
        EmailVerified = emailVerified;
    }

    public static ExternalIdentity Create(string? issuer, string? subject, string? email = null,
        bool emailVerified = false)
    {
        if (string.IsNullOrWhiteSpace(issuer) || issuer.Length > MaxIssuerLength ||
            !Uri.TryCreate(issuer, UriKind.Absolute, out var issuerUri) ||
            (issuerUri.Scheme != Uri.UriSchemeHttp && issuerUri.Scheme != Uri.UriSchemeHttps) ||
            !string.IsNullOrEmpty(issuerUri.UserInfo) || !string.IsNullOrEmpty(issuerUri.Query) ||
            !string.IsNullOrEmpty(issuerUri.Fragment))
        {
            throw new DomainRuleException("invalid_issuer", "issuer", "Issuer must be an absolute HTTP(S) URL.");
        }

        if (string.IsNullOrWhiteSpace(subject) || subject.Length > MaxSubjectLength)
        {
            throw new DomainRuleException("invalid_subject", "subject", "Subject must contain 1 to 200 characters.");
        }

        var normalizedEmail = email is null ? null : email.Trim().ToLowerInvariant();
        if (normalizedEmail is not null && (normalizedEmail.Length is 0 or > 254 ||
            normalizedEmail.Contains(' ') || normalizedEmail.Count(character => character == '@') != 1 ||
            normalizedEmail[0] == '@' || normalizedEmail[^1] == '@'))
        {
            throw new DomainRuleException("invalid_email", "email", "Email address is invalid.");
        }
        if (emailVerified && normalizedEmail is null)
            throw new DomainRuleException("invalid_email", "email", "A verified email address is required.");

        return new ExternalIdentity(issuer, subject, normalizedEmail, emailVerified);
    }
}
