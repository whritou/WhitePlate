using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class BrandAssetsEndpointTests
{
    [Fact]
    public async Task ThemeDraftRoundTripsWithConcurrencyAndDoesNotChangeAnotherRestaurant()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/theme";
        using var initial = await client.GetAsync(path, Ct);
        Assert.Equal(HttpStatusCode.OK, initial.StatusCode);
        Assert.Equal("\"1\"", initial.Headers.ETag?.Tag);
        Assert.True(initial.Headers.CacheControl!.NoStore);
        var draft = JsonNode(await initial.Content.ReadAsStringAsync(Ct));
        draft["primary"] = "#123456";
        draft["font"] = "Inter";
        draft["radius"] = 24;
        draft["ambiance"] = "warm-cream";

        using var missing = await SaveTheme(client, path, draft, null);
        Assert.Equal(HttpStatusCode.PreconditionRequired, missing.StatusCode);
        using var saved = await SaveTheme(client, path, draft, "\"1\"");
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.Equal("\"2\"", saved.Headers.ETag?.Tag);
        using var stale = await SaveTheme(client, path, draft, "\"1\"");
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
        using var readBack = await client.GetAsync(path, Ct);
        var actual = JsonNode(await readBack.Content.ReadAsStringAsync(Ct));
        Assert.Equal("#123456", actual["primary"]!.GetValue<string>());
        Assert.Equal("Inter", actual["font"]!.GetValue<string>());
        Assert.Equal(24, actual["radius"]!.GetValue<int>());
        client.DefaultRequestHeaders.Authorization = new("Bearer", "foreign");
        using var foreign = await client.GetAsync(path, Ct);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var other = await database.Tenants.SingleAsync(item => item.Id != tenant, Ct);
        using var otherRead = await client.GetAsync($"/api/v1/tenants/{other.Id}/theme", Ct);
        Assert.Equal(HttpStatusCode.OK, otherRead.StatusCode);
        Assert.Equal("\"1\"", otherRead.Headers.ETag?.Tag);
        Assert.Equal("#1f7a4d", JsonNode(await otherRead.Content.ReadAsStringAsync(Ct))["primary"]!.GetValue<string>());
    }

    [Fact]
    public async Task ThemeRejectsUnsafeValuesAndDeniesKitchenForeignAndAnonymousAccess()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        var path = $"/api/v1/tenants/{tenant}/theme";
        client.DefaultRequestHeaders.Authorization = new("Bearer", "owner");
        using var initial = await client.GetAsync(path, Ct);
        Assert.Equal(HttpStatusCode.OK, initial.StatusCode);
        var draft = JsonNode(await initial.Content.ReadAsStringAsync(Ct));
        foreach (var pair in new (string Key, object Value)[] {
            ("primary", "url(https://invalid.test)"), ("font", "evil; color:red"),
            ("radius", -1), ("bannerOverlay", 101), ("ambiance", "arbitrary"), ("logo", "https://foreign.test/logo.png") })
        {
            var invalid = (System.Text.Json.Nodes.JsonObject)draft.DeepClone();
            invalid[pair.Key] = System.Text.Json.Nodes.JsonValue.Create(pair.Value);
            using var response = await SaveTheme(client, path, invalid, "\"1\"");
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }
        foreach (var subject in new[] { "kitchen", "foreign" })
        {
            client.DefaultRequestHeaders.Authorization = new("Bearer", subject);
            using var get = await client.GetAsync(path, Ct);
            using var put = await SaveTheme(client, path, draft, "\"1\"");
            using var palette = await client.GetAsync(path + "/palette", Ct);
            Assert.All(new[] { get, put, palette }, response => Assert.Equal(HttpStatusCode.NotFound, response.StatusCode));
        }
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        database.RestaurantMemberships.Remove(await database.RestaurantMemberships.SingleAsync(item => item.Subject == "manager", Ct));
        await database.SaveChangesAsync(Ct);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        using var revoked = await SaveTheme(client, path, draft, "\"1\"");
        Assert.Equal(HttpStatusCode.NotFound, revoked.StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        using var anonymous = await client.GetAsync(path, Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task PaletteUsesOnlyTheSavedLogoAndReportsMissingOrUnavailableStorage()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}";
        using var absent = await client.GetAsync(path + "/theme/palette", Ct);
        Assert.Equal(HttpStatusCode.OK, absent.StatusCode);
        Assert.Contains("no_logo", await absent.Content.ReadAsStringAsync(Ct));
        var logo = await Upload(client, path + "/brand-assets");
        using var pending = await client.GetAsync(path + "/theme/palette", Ct);
        Assert.Contains("no_logo", await pending.Content.ReadAsStringAsync(Ct));
        using var saved = await Change(client, path + "/brand-assets", logo.Id, "none");
        using var palette = await client.GetAsync(path + "/theme/palette", Ct);
        Assert.Equal(HttpStatusCode.OK, palette.StatusCode);
        using var json = JsonDocument.Parse(await palette.Content.ReadAsStringAsync(Ct));
        Assert.Matches("^#[0-9a-fA-F]{6}$", json.RootElement.GetProperty("palette").GetProperty("primary").GetString()!);
        factory.Storage.FailReads = true;
        using var unavailable = await client.GetAsync(path + "/theme/palette", Ct);
        Assert.Equal(HttpStatusCode.OK, unavailable.StatusCode);
        Assert.Contains("unavailable", await unavailable.Content.ReadAsStringAsync(Ct));
    }

    private static System.Text.Json.Nodes.JsonObject JsonNode(string json) =>
        (System.Text.Json.Nodes.JsonObject)System.Text.Json.Nodes.JsonNode.Parse(json)!["theme"]!;

    private static Task<HttpResponseMessage> SaveTheme(HttpClient client, string path,
        System.Text.Json.Nodes.JsonObject draft, string? version)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, path) { Content = JsonContent.Create(draft) };
        if (version is not null) request.Headers.TryAddWithoutValidation("If-Match", version);
        return client.SendAsync(request, Ct);
    }
}
