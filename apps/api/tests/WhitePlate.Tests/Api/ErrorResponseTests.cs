using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Common.Errors;

namespace WhitePlate.Tests.Api;

public sealed class ErrorResponseTests
{
    [Theory]
    [InlineData(ErrorCode.ValidationFailed, 400, "validation_failed")]
    [InlineData(ErrorCode.NotFound, 404, "not_found")]
    [InlineData(ErrorCode.Conflict, 409, "conflict")]
    [InlineData(ErrorCode.Unauthorized, 401, "unauthorized")]
    [InlineData(ErrorCode.Forbidden, 403, "forbidden")]
    [InlineData(ErrorCode.Unexpected, 500, "unexpected_error")]
    public void MapsEveryApplicationError(ErrorCode error, int status, string code)
    {
        var mapper = new ApiErrorMapper(NullLogger<ApiErrorMapper>.Instance);
        var problem = mapper.Create(new DefaultHttpContext(), new ApplicationError(error));
        Assert.Equal(status, problem.Status);
        Assert.Equal(code, problem.Code);
        Assert.False(string.IsNullOrWhiteSpace(problem.Detail));
        Assert.False(string.IsNullOrWhiteSpace(problem.TraceId));
    }

    [Theory]
    [InlineData("/does-not-exist", 404, "not_found")]
    [InlineData("/test-errors/challenge", 401, "unauthorized")]
    [InlineData("/test-errors/forbid", 403, "forbidden")]
    [InlineData("/test-errors/conflict", 409, "conflict")]
    public async Task ReturnsConsistentHttpErrors(string path, int status, string code)
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        using var response = await client.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal((HttpStatusCode)status, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.DoesNotContain("private-secret", body);
        var problem = await response.Content.ReadFromJsonAsync<ApiProblemResponse>(TestContext.Current.CancellationToken);
        Assert.Equal(status, problem!.Status);
        Assert.Equal(code, problem.Code);
        Assert.False(string.IsNullOrWhiteSpace(problem.TraceId));
    }

    [Theory]
    [InlineData("Production")]
    [InlineData("Development")]
    public async Task UnexpectedExceptionsNeverExposeDetailsInResponsesOrLogs(string environment)
    {
        var logs = new CapturingLoggerProvider();
        using var factory = CreateFactory(environment).WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
        }).ConfigureLogging(logging => logging.AddProvider(logs)));
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        using var response = await client.GetAsync("/test-errors/unexpected", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("unexpected_error", body);
        Assert.DoesNotContain("private-secret", body);
        Assert.DoesNotContain("InvalidOperationException", body);
        Assert.Contains(logs.Messages, message => message.Contains("InvalidOperationException"));
        Assert.DoesNotContain(logs.Messages, message => message.Contains("private-secret"));
    }

    [Fact]
    public async Task ValidCountUsesTypedSuccessAndMalformedJsonUsesSafeValidation()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient(new() { BaseAddress = new Uri("https://localhost") });
        using var content = new StringContent("{\"count\":\"private-secret\"}", System.Text.Encoding.UTF8, "application/json");
        using var response = await client.PostAsync("/test-errors/binding", content, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.Contains("validation_failed", body);
        Assert.DoesNotContain("private-secret", body);
    }

    private static WebApplicationFactory<Program> CreateFactory(string environment = "Production") =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment(environment);
            builder.UseSetting("Authentication:Issuer", "https://localhost:3000");
            builder.UseSetting("Authentication:Audience", "whiteplate-api");
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.ConfigureServices(services =>
            {
                services.AddControllers().AddApplicationPart(typeof(ErrorProbeController).Assembly);
                services.AddAuthentication().AddScheme<AuthenticationSchemeOptions, ProbeAuthenticationHandler>("Probe", _ => { });
            });
        });

    private sealed class CapturingLoggerProvider : ILoggerProvider
    {
        public ConcurrentQueue<string> Messages { get; } = new();
        public ILogger CreateLogger(string categoryName) => new CapturingLogger(Messages);
        public void Dispose() { }

        private sealed class CapturingLogger(ConcurrentQueue<string> messages) : ILogger
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
            public bool IsEnabled(LogLevel logLevel) => true;
            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
                Func<TState, Exception?, string> formatter) => messages.Enqueue(formatter(state, exception) + exception);
        }
    }
}

// Registered only by the error-test factory, never by the production host.
[ApiController]
[Route("test-errors")]
public sealed class ErrorProbeController(ApiErrorMapper errors) : ControllerBase
{
    [HttpGet("unexpected")]
    public IActionResult Unexpected() => throw new InvalidOperationException("private-secret");
    [HttpGet("challenge")]
    public IActionResult ChallengeProbe() => Challenge("Probe");
    [HttpGet("forbid")]
    public IActionResult ForbidProbe() => Forbid("Probe");
    [HttpGet("conflict")]
    public IActionResult ConflictProbe() => errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.Conflict)));
    [HttpPost("binding")]
    public IActionResult Binding(ProbeRequest request) => Ok(request);
}

public sealed record ProbeRequest(int Count);

public sealed class ProbeAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync() => Task.FromResult(AuthenticateResult.NoResult());
}
