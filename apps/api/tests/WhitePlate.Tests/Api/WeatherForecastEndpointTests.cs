using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Logging;

namespace WhitePlate.Tests.Api;

public sealed class WeatherForecastEndpointTests
{
    [Fact]
    public async Task WeatherSampleRouteIsRemoved()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

        using var response = await client.GetAsync("/WeatherForecast", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ExposesImplementedRoutesAndTypedErrorsInDevelopmentOpenApi()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

        using var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var document = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(
            TestContext.Current.CancellationToken);
        Assert.False(document.GetProperty("paths").TryGetProperty("/WeatherForecast", out _));
        Assert.True(document.GetProperty("paths").TryGetProperty("/api/v1/tenant", out _));
        Assert.False(document.GetProperty("paths").TryGetProperty("/test-errors/challenge", out _));
        Assert.True(document.GetProperty("paths").TryGetProperty("/api/v1/menu", out _));
    }

    [Fact]
    public async Task OpenApiDeclaresBearerSecurityOnlyForProtectedOperations()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });
        using var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));

        Assert.True(document.RootElement.GetProperty("components").GetProperty("securitySchemes").TryGetProperty("Bearer", out _));
        Assert.True(document.RootElement.GetProperty("paths").GetProperty("/api/v1/tenants/{tenantId}/catalog")
            .GetProperty("get").GetProperty("security").GetArrayLength() > 0);
        Assert.False(document.RootElement.GetProperty("paths").GetProperty("/api/v1/tenant")
            .GetProperty("get").TryGetProperty("security", out _));
        Assert.False(document.RootElement.GetProperty("paths").GetProperty("/api/v1/orders")
            .GetProperty("post").TryGetProperty("security", out _));
    }

    [Fact]
    public async Task DoesNotExposeOpenApiInProduction()
    {
        using var factory = CreateFactory("Production");
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

        using var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ProductionSwaggerCanBeEnabledExplicitly()
    {
        using var factory = CreateFactory("Production", enableSwagger: true);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions { BaseAddress = new Uri("https://localhost") });

        using var response = await client.GetAsync("/swagger/index.html", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ProvidesInteractiveSwaggerUiInDevelopment()
    {
        using var factory = CreateFactory();
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });

        using var response = await client.GetAsync("/swagger/index.html", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("Swagger UI", await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task SwaggerUsesSameOriginBehindRenderProxy()
    {
        using var factory = CreateFactory("Production", enableSwagger: true, render: true);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("http://whiteplate.onrender.com"), AllowAutoRedirect = false
        });
        using var response = await client.GetAsync("/openapi/v1.json", TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var document = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("/", document.RootElement.GetProperty("servers")[0].GetProperty("url").GetString());
    }

    [Theory]
    [InlineData("GET")]
    [InlineData("HEAD")]
    public async Task RenderRootProbeReturnsSuccess(string method)
    {
        using var factory = CreateFactory("Production", render: true);
        using var client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("http://whiteplate.onrender.com"), AllowAutoRedirect = false
        });
        using var request = new HttpRequestMessage(new HttpMethod(method), "/");
        using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    private static WebApplicationFactory<Program> CreateFactory(string environment = "Development", bool enableSwagger = false, bool render = false) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("environment", environment);
            builder.UseSetting("Authentication:Issuer", "https://localhost:3000");
            builder.UseSetting("Authentication:Audience", "whiteplate-api");
            builder.UseSetting("Swagger:Enabled", enableSwagger.ToString());
            builder.UseSetting("RENDER", render.ToString());
            builder.ConfigureLogging(logging => logging.ClearProviders());
        });
}
