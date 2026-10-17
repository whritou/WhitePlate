using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Payments;
using WhitePlate.Domain.Payments;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}/stripe-connect")]
[ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
public sealed class StripeConnectController(ICurrentIdentity currentIdentity, StripeConnectHandler handler,
    StripeConnectOptions options, ApiErrorMapper errors) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetStatus(Guid tenantId, CancellationToken cancellationToken)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.GetStatusAsync(tenantId, identity, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("oauth/start")]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> StartOAuth(Guid tenantId, StripeConnectStartRequest request,
        CancellationToken cancellationToken)
    {
        if (currentIdentity.Identity is not { } identity) return Unauthorized();
        var result = await handler.StartOAuthAsync(tenantId, identity, request.Locale, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [AllowAnonymous]
    [HttpGet("~/api/v1/stripe-connect/oauth/callback")]
    public async Task<IActionResult> OAuthCallback([FromQuery] string? state, [FromQuery] string? code,
        [FromQuery] string? error, CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(options.FrontendBaseUrl, UriKind.Absolute, out var frontend) ||
            frontend.Scheme != Uri.UriSchemeHttps && !(frontend.IsLoopback && frontend.Scheme == Uri.UriSchemeHttp))
            return StatusCode(StatusCodes.Status503ServiceUnavailable);
        var result = await handler.CompleteOAuthAsync(state, code, error, cancellationToken);
        var locale = result.Locale == "fr" ? "fr" : "en";
        var destination = new Uri(new Uri(frontend.ToString().TrimEnd('/') + "/"),
            $"{locale}/organization/restaurant-settings");
        var query = new List<string> { "section=payments" };
        if (result.TenantId is { } tenantId) query.Add($"tenantId={Uri.EscapeDataString(tenantId.ToString())}");
        query.Add($"stripeConnectResult={Uri.EscapeDataString(result.Outcome)}");
        var redirect = new UriBuilder(destination) { Query = string.Join('&', query) };
        return Redirect(redirect.Uri.ToString());
    }
}

public sealed record StripeConnectStartRequest(string? Locale);

[ApiController]
[AllowAnonymous]
[Route("api/v1/stripe-connect/webhooks/{mode}")]
public sealed class StripeConnectWebhookController(StripeConnectHandler handler) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(2_000_000)]
    public async Task<IActionResult> Receive(string mode, CancellationToken cancellationToken)
    {
        var stripeMode = mode switch
        {
            "test" => StripeConnectMode.Test,
            "live" => StripeConnectMode.Live,
            _ => (StripeConnectMode?)null
        };
        if (stripeMode is null) return BadRequest();

        using var reader = new StreamReader(Request.Body, System.Text.Encoding.UTF8,
            detectEncodingFromByteOrderMarks: false, leaveOpen: true);
        var rawBody = await reader.ReadToEndAsync(cancellationToken);
        var signature = Request.Headers["Stripe-Signature"].ToString();
        if (string.IsNullOrWhiteSpace(signature)) return BadRequest();
        var accepted = await handler.ProcessWebhookAsync(stripeMode.Value, rawBody, signature,
            cancellationToken);
        return accepted ? Ok() : BadRequest();
    }
}
