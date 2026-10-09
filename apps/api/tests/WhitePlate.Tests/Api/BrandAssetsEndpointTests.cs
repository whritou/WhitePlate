using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using ImageMagick;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WhitePlate.Api.Tenancy;
using WhitePlate.Application.Media;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Media;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class BrandAssetsEndpointTests
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task DraftIsPrivateUntilSavedAndFailedReplacementPreservesActiveAsset()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/brand-assets";
        var draft = await Upload(client, path);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            var other = await db.Tenants.SingleAsync(item => item.Id != tenant, Ct);
            client.DefaultRequestHeaders.Authorization = new("Bearer", "foreign");
            var foreignDraft = await Upload(client, $"/api/v1/tenants/{other.Id}/brand-assets");
            client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
            using var foreignPreview = await client.GetAsync($"{path}/uploads/{foreignDraft.Id}", Ct);
            using var foreignSave = await Change(client, path, foreignDraft.Id, "none");
            Assert.Equal(HttpStatusCode.NotFound, foreignPreview.StatusCode);
            Assert.Equal(HttpStatusCode.NotFound, foreignSave.StatusCode);
        }
        using var privatePreview = await client.GetAsync($"{path}/uploads/{draft.Id}", Ct);
        Assert.Equal(HttpStatusCode.OK, privatePreview.StatusCode);
        Assert.True(privatePreview.Headers.CacheControl!.NoStore);
        Assert.Equal("image/png", privatePreview.Content.Headers.ContentType!.MediaType);
        using var unpublished = await client.GetAsync("https://bistro.example.test/api/v1/brand-assets/logo", Ct);
        Assert.Equal(HttpStatusCode.NotFound, unpublished.StatusCode);
        using var saved = await Change(client, path, draft.Id, "none");
        Assert.Equal(HttpStatusCode.NoContent, saved.StatusCode);
        var readBack = await client.GetFromJsonAsync<BrandAssetsDto>(path, Ct);
        Assert.Equal(draft.Id, Assert.Single(readBack!.Assets).Id);
        using var publicImage = await client.GetAsync("https://bistro.example.test/api/v1/brand-assets/logo", Ct);
        Assert.Equal(HttpStatusCode.OK, publicImage.StatusCode);
        Assert.Equal(await privatePreview.Content.ReadAsByteArrayAsync(Ct), await publicImage.Content.ReadAsByteArrayAsync(Ct));
        factory.Storage.FailWrites = true;
        using var failed = await client.PostAsync($"{path}/logo/uploads", Binary(ImageBytes()), Ct);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, failed.StatusCode);
        Assert.Equal(draft.Id, Assert.Single((await client.GetFromJsonAsync<BrandAssetsDto>(path, Ct))!.Assets).Id);
        factory.Storage.FailWrites = false;
        var replacement = await Upload(client, path);
        using var stale = await Change(client, path, replacement.Id, "none");
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
        using var replaced = await Change(client, path, replacement.Id, draft.Id.ToString());
        Assert.Equal(HttpStatusCode.NoContent, replaced.StatusCode);
        using var removeRequest = new HttpRequestMessage(HttpMethod.Delete, $"{path}/logo");
        removeRequest.Headers.Add("If-Match", $"\"{replacement.Id}\"");
        using var removed = await client.SendAsync(removeRequest, Ct);
        Assert.Equal(HttpStatusCode.NoContent, removed.StatusCode);
        using var fallback = await client.GetAsync("https://bistro.example.test/api/v1/brand-assets/logo", Ct);
        Assert.Equal(HttpStatusCode.NotFound, fallback.StatusCode);
    }

    [Fact]
    public async Task ForeignTenantKitchenAndRevokedManagerCannotReadOrMutatePrivateAssets()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        var path = $"/api/v1/tenants/{tenant}/brand-assets";
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var draft = await Upload(client, path);
        foreach (var subject in new[] { "foreign", "kitchen" })
        {
            client.DefaultRequestHeaders.Authorization = new("Bearer", subject);
            using var list = await client.GetAsync(path, Ct);
            using var preview = await client.GetAsync($"{path}/uploads/{draft.Id}", Ct);
            using var upload = await client.PostAsync($"{path}/logo/uploads", Binary(ImageBytes()), Ct);
            using var save = await Change(client, path, draft.Id, "none");
            Assert.All(new[] { list, preview, upload, save }, result => Assert.Equal(HttpStatusCode.NotFound, result.StatusCode));
        }
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        db.RestaurantMemberships.Remove(await db.RestaurantMemberships.SingleAsync(item => item.Subject == "manager", Ct));
        await db.SaveChangesAsync(Ct);
        using var revoked = await client.GetAsync($"{path}/uploads/{draft.Id}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, revoked.StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        using var anonymous = await client.GetAsync(path, Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
    }

    [Fact]
    public async Task InvalidContentCannotReplaceAnAssetAndCleanupDeletesOnlyExpiredPrivateObjects()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/brand-assets";
        using var invalid = await client.PostAsync($"{path}/logo/uploads", Binary(System.Text.Encoding.UTF8.GetBytes("<svg/>")), Ct);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        var active = await Upload(client, path);
        using var saved = await Change(client, path, active.Id, "none");
        var pending = await Upload(client, path);
        factory.Clock.Now = factory.Clock.Now.AddDays(2);
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ExpiredMediaCleanup>().RunAsync(Ct);
        var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        Assert.Equal(active.Id, Assert.Single(await db.MediaAssets.ToArrayAsync(Ct)).Id);
        Assert.Single(factory.Storage.Objects);
        using var expired = await client.GetAsync($"{path}/uploads/{pending.Id}", Ct);
        Assert.Equal(HttpStatusCode.NotFound, expired.StatusCode);
    }

    private static ByteArrayContent Binary(byte[] bytes)
    {
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new("application/octet-stream");
        return content;
    }

    [Fact]
    public async Task OwnerCanReadAssetsButAnAuthenticatedPrincipalWithoutIdentityCannot()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "owner");
        using var owner = await client.GetAsync($"/api/v1/tenants/{tenant}/brand-assets", Ct);
        Assert.Equal(HttpStatusCode.OK, owner.StatusCode);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "incomplete");
        using var incomplete = await client.GetAsync($"/api/v1/tenants/{tenant}/brand-assets", Ct);
        Assert.Equal(HttpStatusCode.Unauthorized, incomplete.StatusCode);
    }
    private static byte[] ImageBytes()
    {
        using var image = new MagickImage(MagickColors.Green, 512, 512);
        return image.ToByteArray(MagickFormat.Png);
    }
    private static async Task<MediaAssetDto> Upload(HttpClient client, string path)
    {
        using var response = await client.PostAsync($"{path}/logo/uploads", Binary(ImageBytes()), Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<MediaAssetDto>(Ct))!;
    }
    private static Task<HttpResponseMessage> Change(HttpClient client, string path, Guid id, string expected)
    {
        var request = new HttpRequestMessage(HttpMethod.Put, $"{path}/logo") { Content = JsonContent.Create(new { assetId = id }) };
        request.Headers.Add("If-Match", $"\"{expected}\"");
        return client.SendAsync(request, Ct);
    }

    private sealed class MediaFactory : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");
        public readonly TestStorage Storage = new();
        public readonly TestClock Clock = new();
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Production");
            builder.UseSetting("Authentication:Issuer", "https://localhost:3000");
            builder.UseSetting("Authentication:Audience", "whiteplate-api");
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.ConfigureServices(services =>
            {
                foreach (var service in services.Where(item => item.ServiceType == typeof(IHostedService)).ToArray()) services.Remove(service);
                services.AddAuthentication("test").AddScheme<AuthenticationSchemeOptions, MediaAuthentication>("test", _ => { });
                services.PostConfigure<TenantHostOptions>(options => options.BaseDomain = "example.test");
                services.RemoveAll<DbContextOptions<WhitePlateDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WhitePlateDbContext>>();
                services.AddDbContext<WhitePlateDbContext>(options => options.UseSqlite(connection));
                services.RemoveAll<IMediaStorage>();
                services.AddSingleton<IMediaStorage>(Storage);
                services.RemoveAll<TimeProvider>();
                services.AddSingleton<TimeProvider>(Clock);
            });
        }
        public async Task<Guid> SeedAsync()
        {
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            await db.Database.EnsureCreatedAsync(Ct);
            var org = Organization.Create("Bistro group");
            var foreign = Organization.Create("Other group");
            var tenant = Tenant.Create(org.Id, "Bistro", "bistro", "EUR");
            db.Organizations.AddRange(org, foreign);
            db.Tenants.AddRange(tenant, Tenant.Create(foreign.Id, "Other", "other", "EUR"));
            db.OrganizationOwnerMemberships.Add(OrganizationOwnerMembership.Create(foreign.Id, ExternalIdentity.Create("https://identity.example.test/", "foreign")));
            db.OrganizationOwnerMemberships.Add(OrganizationOwnerMembership.Create(org.Id, ExternalIdentity.Create("https://identity.example.test/", "owner")));
            db.RestaurantMemberships.AddRange(RestaurantMembership.Create(tenant.Id, ExternalIdentity.Create("https://identity.example.test/", "manager"), RestaurantRole.Manager),
                RestaurantMembership.Create(tenant.Id, ExternalIdentity.Create("https://identity.example.test/", "kitchen"), RestaurantRole.Kitchen));
            await db.SaveChangesAsync(Ct);
            return tenant.Id;
        }
        protected override void Dispose(bool disposing) { base.Dispose(disposing); if (disposing) connection.Dispose(); }
    }
    private sealed class TestClock : TimeProvider
    {
        public DateTimeOffset Now = DateTimeOffset.UtcNow;
        public override DateTimeOffset GetUtcNow() => Now;
    }
    private sealed class TestStorage : IMediaStorage
    {
        public bool IsAvailable => true;
        public bool FailWrites;
        public readonly Dictionary<string, byte[]> Objects = [];
        public Task PutAsync(string key, byte[] bytes, string type, CancellationToken ct)
        {
            if (FailWrites) throw new MediaUnavailableException();
            Objects[key] = bytes;
            return Task.CompletedTask;
        }
        public Task<byte[]> GetAsync(string key, CancellationToken ct) => Task.FromResult(Objects[key]);
        public Task DeleteAsync(string key, CancellationToken ct) { Objects.Remove(key); return Task.CompletedTask; }
    }
    private sealed class MediaAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
        : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var subject = Request.Headers.Authorization.ToString().Split(' ').LastOrDefault();
            if (string.IsNullOrEmpty(subject)) return Task.FromResult(AuthenticateResult.NoResult());
            var claims = new List<Claim> { new("iss", "https://identity.example.test/") };
            if (subject != "incomplete") claims.Add(new("sub", subject));
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, Scheme.Name));
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name)));
        }
    }
}
