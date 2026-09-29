using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Identity;

public sealed record ExternalIdentity
{
    public const int MaxIssuerLength = 500;
    public const int MaxSubjectLength = 200;

    public string Issuer { get; }
    public string Subject { get; }

    private ExternalIdentity(string issuer, string subject)
    {
        Issuer = issuer;
        Subject = subject;
    }

    public static ExternalIdentity Create(string? issuer, string? subject)
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

        return new ExternalIdentity(issuer, subject);
    }
}
