using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task ChangedTranslationWaitsForASecondManagerBeforeUpdatingCatalog()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "author", RestaurantRole.Manager);
        await factory.SeedMembershipAsync(seeded.TenantId, "reviewer", RestaurantRole.Manager);
        using var author = factory.CreateClient();
        author.DefaultRequestHeaders.Authorization = new("Bearer", "author");

        using var languageUpdate = await author.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/menu-languages",
            new { locales = new[] { "en", "fr" }, defaultLocale = "en" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, languageUpdate.StatusCode);

        using var submission = await author.PutAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/catalog/products/{seeded.ProductId}/translation",
            new { locale = "fr", name = "Soupe", description = "Soupe fraîche" },
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, submission.StatusCode);
        using var submissionJson = JsonDocument.Parse(await submission.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        var reviewId = submissionJson.RootElement.GetProperty("reviewId").GetGuid();
        Assert.Equal("Pending", submissionJson.RootElement.GetProperty("status").GetString());
        Assert.False(submissionJson.RootElement.GetProperty("unchanged").GetBoolean());

        using (var scope = factory.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            var saved = await database.Products.AsNoTracking().SingleAsync(item => item.Id == seeded.ProductId,
                TestContext.Current.CancellationToken);
            Assert.False(CatalogTranslations.HasTranslation(saved.TranslationsJson, "fr"));
            Assert.Equal(CatalogTranslationReviewStatus.Pending,
                await database.CatalogTranslationReviews.Where(item => item.Id == reviewId)
                    .Select(item => item.Status).SingleAsync(TestContext.Current.CancellationToken));
        }

        using var selfApproval = await author.PostAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/catalog/translation-reviews/{reviewId}/approve",
            new { expectedVersion = 1 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, selfApproval.StatusCode);

        using var reviewer = factory.CreateClient();
        reviewer.DefaultRequestHeaders.Authorization = new("Bearer", "reviewer");
        using var approval = await reviewer.PostAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/catalog/translation-reviews/{reviewId}/approve",
            new { expectedVersion = 1 }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NoContent, approval.StatusCode);

        using var finalScope = factory.Services.CreateScope();
        var finalDatabase = finalScope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var approved = await finalDatabase.Products.AsNoTracking().SingleAsync(item => item.Id == seeded.ProductId,
            TestContext.Current.CancellationToken);
        Assert.Equal("Soupe", CatalogTranslations.GetAll(approved.TranslationsJson)["fr"].Name);
    }
}
