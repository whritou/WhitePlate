using WhitePlate.Application.Identity;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Api.Identity;

public sealed class HttpCurrentIdentity(IHttpContextAccessor contextAccessor) : ICurrentIdentity
{
    public ExternalIdentity? Identity
    {
        get
        {
            var principal = contextAccessor.HttpContext?.User;
            if (principal?.Identity?.IsAuthenticated != true) return null;
            var issuer = principal.FindFirst("iss")?.Value;
            var subject = principal.FindFirst("sub")?.Value;
            var email = principal.FindFirst("email")?.Value;
            var emailVerified = bool.TryParse(principal.FindFirst("email_verified")?.Value, out var verified) && verified;
            if (issuer is null || subject is null) return null;
            try
            {
                return ExternalIdentity.Create(issuer, subject, email, emailVerified);
            }
            catch (DomainRuleException)
            {
                return null;
            }
        }
    }
}
