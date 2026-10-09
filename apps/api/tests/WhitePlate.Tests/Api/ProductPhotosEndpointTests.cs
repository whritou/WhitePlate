using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Domain.Catalog;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Media;

namespace WhitePlate.Tests.Api;

public sealed partial class BrandAssetsEndpointTests
{
    [Fact]
    public async Task GallerySaveReadBackReplacementFailureAndRemovalPreserveOtherPhotos()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        var product = await SeedProduct(factory, tenant);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/products/{product}/photos";
        var first = await UploadPhoto(client, path);
        var second = await UploadPhoto(client, path, "4:3");
        using var draftPublic = await client.GetAsync($"https://bistro.example.test/api/v1/products/{product}/photos/{first}/320", Ct);
        Assert.Equal(HttpStatusCode.NotFound, draftPublic.StatusCode);
        using var save = await client.PutAsJsonAsync(path, new { assetIds = new[] { first, second }, expectedIds = Array.Empty<Guid>() }, Ct);
        Assert.Equal(HttpStatusCode.OK, save.StatusCode);
        var gallery = await client.GetFromJsonAsync<JsonElement>(path, Ct);
        Assert.Equal(new[] { first, second }, gallery.GetProperty("assets").EnumerateArray().Select(a => a.GetProperty("id").GetGuid()));
        var menu = await client.GetFromJsonAsync<JsonElement>("https://bistro.example.test/api/v1/menu", Ct);
        Assert.Equal(first, menu.GetProperty("categories")[0].GetProperty("products")[0].GetProperty("photos")[0].GetProperty("id").GetGuid());
        using var visible = await client.GetAsync($"https://bistro.example.test/api/v1/products/{product}/photos/{second}/640", Ct);
        Assert.Equal(HttpStatusCode.OK, visible.StatusCode);
        Assert.True(visible.Headers.CacheControl!.NoStore);
        factory.Storage.FailWrites = true;
        using var failed = await client.PostAsync($"{path}/uploads?aspect=1:1", Binary(ImageBytes()), Ct);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, failed.StatusCode);
        factory.Storage.FailWrites = false;
        var replacement = await UploadPhoto(client, path);
        using var stale = await client.PutAsJsonAsync(path, new { assetIds = new[] { replacement, second }, expectedIds = Array.Empty<Guid>() }, Ct);
        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
        using var replace = await client.PutAsJsonAsync(path, new { assetIds = new[] { second, replacement }, expectedIds = new[] { first, second } }, Ct);
        Assert.Equal(HttpStatusCode.OK, replace.StatusCode);
        using var retired = await client.GetAsync($"https://bistro.example.test/api/v1/products/{product}/photos/{first}/320", Ct);
        Assert.Equal(HttpStatusCode.NotFound, retired.StatusCode);
        using var remove = await client.PutAsJsonAsync(path, new { assetIds = new[] { second }, expectedIds = new[] { second, replacement } }, Ct);
        Assert.Equal(HttpStatusCode.OK, remove.StatusCode);
        factory.Clock.Now = factory.Clock.Now.AddDays(8);
        using var scope = factory.Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<ExpiredMediaCleanup>().RunAsync(Ct);
        var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var active = await db.MediaAssets.Where(a => a.IsActive).ToListAsync(Ct);
        Assert.Equal(second, Assert.Single(active).Id);
        Assert.Equal(3, factory.Storage.Objects.Count);
    }

    [Fact]
    public async Task GalleryDeniesForeignProductsMediaRevokedMembershipAndArchivedWrites()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        var product = await SeedProduct(factory, tenant);
        var otherProduct = await SeedProduct(factory, tenant);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/products/{product}/photos";
        var other = await UploadPhoto(client, $"/api/v1/tenants/{tenant}/products/{otherProduct}/photos");
        using var wrongProduct = await client.PutAsJsonAsync(path, new { assetIds = new[] { other }, expectedIds = Array.Empty<Guid>() }, Ct);
        Assert.Equal(HttpStatusCode.NotFound, wrongProduct.StatusCode);
        foreach (var subject in new[] { "foreign", "kitchen" })
        {
            client.DefaultRequestHeaders.Authorization = new("Bearer", subject);
            using var denied = await client.GetAsync(path, Ct);
            Assert.Equal(HttpStatusCode.NotFound, denied.StatusCode);
        }
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        (await db.Products.SingleAsync(p => p.Id == product, Ct)).Archive();
        await db.SaveChangesAsync(Ct);
        using var archived = await client.PostAsync($"{path}/uploads", Binary(ImageBytes()), Ct);
        Assert.Equal(HttpStatusCode.NotFound, archived.StatusCode);
        db.RestaurantMemberships.Remove(await db.RestaurantMemberships.SingleAsync(m => m.Subject == "manager", Ct));
        await db.SaveChangesAsync(Ct);
        using var revoked = await client.GetAsync($"/api/v1/tenants/{tenant}/products/{otherProduct}/photos/uploads/{other}/1200", Ct);
        Assert.Equal(HttpStatusCode.NotFound, revoked.StatusCode);
    }

    [Fact]
    public async Task GalleryRejectsInvalidContentAspectAndDuplicatePhotos()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        var product = await SeedProduct(factory, tenant);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/products/{product}/photos";
        using var invalid = await client.PostAsync($"{path}/uploads?aspect=1:1", Binary("<svg/>"u8.ToArray()), Ct);
        using var aspect = await client.PostAsync($"{path}/uploads?aspect=16:9", Binary(ImageBytes()), Ct);
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, aspect.StatusCode);
        var photo = await UploadPhoto(client, path);
        using var duplicate = await client.PutAsJsonAsync(path, new { assetIds = new[] { photo, photo }, expectedIds = Array.Empty<Guid>() }, Ct);
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
    }

    private static async Task<Guid> SeedProduct(MediaFactory factory, Guid tenant)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var category = MenuCategory.Create(tenant, "Dishes", 0);
        var product = Product.Create(tenant, category.Id, "Burger", null, 12, 10, 0);
        db.MenuCategories.Add(category);
        db.Products.Add(product);
        await db.SaveChangesAsync(Ct);
        return product.Id;
    }

    [Fact]
    public async Task HiddenCategoryPhotosStayPrivateAndForeignTenantPhotosCannotBeAttached()
    {
        using var factory = new MediaFactory();
        using var client = factory.CreateClient();
        var tenant = await factory.SeedAsync();
        var product = await SeedProduct(factory, tenant);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        var path = $"/api/v1/tenants/{tenant}/products/{product}/photos";
        var photo = await UploadPhoto(client, path);
        using var saved = await client.PutAsJsonAsync(path, new { assetIds = new[] { photo }, expectedIds = Array.Empty<Guid>() }, Ct);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var category = await db.MenuCategories.SingleAsync(c => c.TenantId == tenant, Ct);
        category.SetVisibility(false);
        await db.SaveChangesAsync(Ct);
        using var hidden = await client.GetAsync($"https://bistro.example.test/api/v1/products/{product}/photos/{photo}/320", Ct);
        Assert.Equal(HttpStatusCode.NotFound, hidden.StatusCode);
        using var preview = await client.GetAsync($"{path}/uploads/{photo}/320", Ct);
        Assert.Equal(HttpStatusCode.OK, preview.StatusCode);
        var foreignTenant = await db.Tenants.SingleAsync(t => t.Id != tenant, Ct);
        var foreignProduct = await SeedProduct(factory, foreignTenant.Id);
        client.DefaultRequestHeaders.Authorization = new("Bearer", "foreign");
        var foreignPhoto = await UploadPhoto(client, $"/api/v1/tenants/{foreignTenant.Id}/products/{foreignProduct}/photos");
        client.DefaultRequestHeaders.Authorization = new("Bearer", "manager");
        using var denied = await client.PutAsJsonAsync(path, new { assetIds = new[] { foreignPhoto }, expectedIds = new[] { photo } }, Ct);
        Assert.Equal(HttpStatusCode.NotFound, denied.StatusCode);
        using var foreignRead = await client.GetAsync($"{path}/uploads/{foreignPhoto}/320", Ct);
        Assert.Equal(HttpStatusCode.NotFound, foreignRead.StatusCode);
    }

    private static async Task<Guid> UploadPhoto(HttpClient client, string path, string aspect = "1:1")
    {
        using var response = await client.PostAsync($"{path}/uploads?aspect={aspect}", Binary(ImageBytes()), Ct);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>(Ct);
        return body.GetProperty("id").GetGuid();
    }
}
