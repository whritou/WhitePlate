using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using WhitePlate.Domain.Identity;
using WhitePlate.Api.Tenancy;
using WhitePlate.Api.Realtime;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task KitchenHubNegotiationRequiresAuthentication()
    {
        using var factory = new OrdersFactory();
        using var client = factory.CreateClient();

        using var response = await client.PostAsync("/hubs/orders/negotiate?negotiateVersion=1", null,
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task PublicCheckoutPricesOptionsAndDiscountsAndIdempotentRetryReturnsSameReceipt()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "checkout-0001");
        var payload = new
        {
            customerName = "Ada",
            discountCode = "save",
            items = new[] { new { productId = seeded.ProductId, quantity = 2, optionIds = new[] { seeded.OptionId } } }
        };

        using var first = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal("\"1\"", first.Headers.ETag?.Tag);
        using var firstJson = JsonDocument.Parse(await first.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var receipt = firstJson.RootElement;
        var orderId = receipt.GetProperty("id").GetGuid();
        Assert.Equal("EUR", receipt.GetProperty("currency").GetString());
        Assert.Equal("Pending", receipt.GetProperty("status").GetString());
        Assert.Equal(19.50m, receipt.GetProperty("subtotal").GetDecimal());
        Assert.Equal(2m, receipt.GetProperty("discountAmount").GetDecimal());
        Assert.Equal(1.75m, receipt.GetProperty("taxAmount").GetDecimal());
        Assert.Equal(19.25m, receipt.GetProperty("total").GetDecimal());
        Assert.Equal("Soup", receipt.GetProperty("lines")[0].GetProperty("productName").GetString());

        using var retry = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, retry.StatusCode);
        using var retryJson = JsonDocument.Parse(await retry.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(orderId, retryJson.RootElement.GetProperty("id").GetGuid());

        using var conflictingRetry = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Grace",
            discountCode = "save",
            items = new[] { new { productId = seeded.ProductId, quantity = 2, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, conflictingRetry.StatusCode);

        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        Assert.Equal(1, await database.Orders.CountAsync(TestContext.Current.CancellationToken));
        Assert.Equal(1, await database.OrderOutboxMessages.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task PublicTrackingRequiresTenantAndCapabilityAndReturnsOnlyOrderStatus()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "tracking-order-0001");
        var trackingToken = Convert.ToBase64String(Enumerable.Repeat((byte)7, 32).ToArray())
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');

        using var created = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            trackingToken,
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        using var createdJson = JsonDocument.Parse(await created.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var orderId = createdJson.RootElement.GetProperty("id").GetGuid();
        Assert.False(createdJson.RootElement.TryGetProperty("trackingToken", out _));

        using var tracking = await client.PostAsJsonAsync($"https://bistro.example.test/api/v1/orders/{orderId}/tracking",
            new { token = trackingToken }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, tracking.StatusCode);
        Assert.Contains("no-store", tracking.Headers.CacheControl?.ToString());
        using var trackingJson = JsonDocument.Parse(await tracking.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(orderId, trackingJson.RootElement.GetProperty("id").GetGuid());
        Assert.Equal("Pending", trackingJson.RootElement.GetProperty("status").GetString());
        Assert.False(trackingJson.RootElement.TryGetProperty("customerName", out _));
        Assert.False(trackingJson.RootElement.TryGetProperty("total", out _));

        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        using var transition = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Preparing" })
        };
        transition.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var transitioned = await client.SendAsync(transition, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, transitioned.StatusCode);

        using var updatedTracking = await client.PostAsJsonAsync(
            $"https://bistro.example.test/api/v1/orders/{orderId}/tracking", new { token = trackingToken },
            TestContext.Current.CancellationToken);
        using var updatedJson = JsonDocument.Parse(await updatedTracking.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Preparing", updatedJson.RootElement.GetProperty("status").GetString());

        using var invalidToken = await client.PostAsJsonAsync($"https://bistro.example.test/api/v1/orders/{orderId}/tracking",
            new { token = new string('A', 43) }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, invalidToken.StatusCode);

        using var foreignTenant = await client.PostAsJsonAsync($"https://other.example.test/api/v1/orders/{orderId}/tracking",
            new { token = trackingToken }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreignTenant.StatusCode);

        factory.AdvanceTime(TimeSpan.FromDays(30));
        using var expired = await client.PostAsJsonAsync($"https://bistro.example.test/api/v1/orders/{orderId}/tracking",
            new { token = trackingToken }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, expired.StatusCode);

        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var order = await database.Orders.SingleAsync(item => item.Id == orderId, TestContext.Current.CancellationToken);
        Assert.Equal(Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(
            System.Text.Encoding.UTF8.GetBytes(trackingToken))).ToLowerInvariant(), order.TrackingTokenHash);
        Assert.DoesNotContain(trackingToken, order.TrackingTokenHash);
        Assert.Equal(DateTimeOffset.Parse("2026-01-31T00:00:00Z"), order.TrackingTokenExpiresAt);
    }

    [Fact]
    public async Task LocalizedCheckoutKeepsHistoricalLabelsAndIncludesEffectiveLocaleInIdempotency()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            var tenant = await database.Tenants.SingleAsync(item => item.Id == seeded.TenantId,
                TestContext.Current.CancellationToken);
            tenant.UpdateMenuLocales(["en", "fr"], "en");
            (await database.Products.SingleAsync(item => item.Id == seeded.ProductId,
                TestContext.Current.CancellationToken)).SetTranslation("fr", "Soupe", null);
            (await database.ProductOptions.SingleAsync(item => item.Id == seeded.OptionId,
                TestContext.Current.CancellationToken)).SetTranslation("fr", "Grande", null);
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "localized-checkout-0001");
        var payload = new
        {
            customerName = "Ada",
            menuLocale = "fr",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        };

        using var first = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        using var firstJson = JsonDocument.Parse(await first.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var receipt = firstJson.RootElement;
        var orderId = receipt.GetProperty("id").GetGuid();
        Assert.Equal("fr", receipt.GetProperty("menuLocale").GetString());
        Assert.Equal("Soupe", receipt.GetProperty("lines")[0].GetProperty("productName").GetString());
        Assert.Equal("Grande", receipt.GetProperty("lines")[0].GetProperty("options")[0].GetProperty("name").GetString());

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            (await database.Products.SingleAsync(item => item.Id == seeded.ProductId,
                TestContext.Current.CancellationToken)).SetTranslation("fr", "Potage", null);
            (await database.ProductOptions.SingleAsync(item => item.Id == seeded.OptionId,
                TestContext.Current.CancellationToken)).SetTranslation("fr", "Maxi", null);
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        using var retry = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        using var retryJson = JsonDocument.Parse(await retry.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(orderId, retryJson.RootElement.GetProperty("id").GetGuid());
        Assert.Equal("Soupe", retryJson.RootElement.GetProperty("lines")[0].GetProperty("productName").GetString());

        using var fallbackConflict = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            menuLocale = "es",
            items = payload.items
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, fallbackConflict.StatusCode);

        using var scopeRead = factory.Services.CreateScope();
        var readDatabase = scopeRead.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var storedOrder = await readDatabase.Orders.Include(item => item.Lines)
            .ThenInclude(item => item.Options).SingleAsync(TestContext.Current.CancellationToken);
        Assert.Equal("fr", storedOrder.MenuLocale);
        Assert.Equal("Soupe", storedOrder.Lines.Single().ProductName);
        Assert.Equal("Grande", storedOrder.Lines.Single().Options.Single().Name);
        Assert.Equal(1, await readDatabase.Orders.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task PublicCheckoutRequiresAnIdempotencyKey()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();

        using var response = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("validation_failed", json.RootElement.GetProperty("code").GetString());
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>()
            .Orders.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task CheckoutIsRateLimitedPerTenantAndClient()
    {
        using var factory = new OrdersFactory(checkoutPermitLimit: 1);
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();

        async Task<HttpResponseMessage> SubmitAsync(string host, string key, Guid productId, Guid[] optionIds)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"https://{host}/api/v1/orders")
            {
                Content = JsonContent.Create(new
                {
                    customerName = "Ada",
                    items = new[] { new { productId, quantity = 1, optionIds } }
                })
            };
            request.Headers.Add("Idempotency-Key", key);
            return await client.SendAsync(request, TestContext.Current.CancellationToken);
        }

        using var first = await SubmitAsync("bistro.example.test", "rate-limit-order-1",
            seeded.ProductId, [seeded.OptionId]);
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        using var limited = await SubmitAsync("bistro.example.test", "rate-limit-order-2",
            seeded.ProductId, [seeded.OptionId]);
        Assert.Equal((HttpStatusCode)429, limited.StatusCode);
        using var otherTenant = await SubmitAsync("other.example.test", "rate-limit-order-3",
            seeded.OtherProductId, []);
        Assert.Equal(HttpStatusCode.Created, otherTenant.StatusCode);
    }

    [Fact]
    public async Task CheckoutRejectsOversizedRequestBodies()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "oversized-checkout-0001");

        using var response = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } },
            padding = new string('x', 20 * 1024)
        }, TestContext.Current.CancellationToken);

        Assert.Equal((HttpStatusCode)413, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>()
            .Orders.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task IdempotencyRecordExpiresAfterTwentyFourHoursAndAllowsANewOrder()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "checkout-expiry-0001");
        var payload = new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        };

        using var first = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        using var firstJson = JsonDocument.Parse(await first.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var originalId = firstJson.RootElement.GetProperty("id").GetGuid();
        factory.AdvanceTime(TimeSpan.FromHours(25));

        using var afterExpiry = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, afterExpiry.StatusCode);
        using var afterExpiryJson = JsonDocument.Parse(await afterExpiry.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.NotEqual(originalId, afterExpiryJson.RootElement.GetProperty("id").GetGuid());
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        Assert.Equal(2, await database.Orders.CountAsync(TestContext.Current.CancellationToken));
        Assert.Single(await database.OrderIdempotencyRecords.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task CheckoutRejectsForeignProductsAndSelectionsThatMissRequiredOptions()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "foreign-product-0001");
        using var foreign = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.OtherProductId, quantity = 1, optionIds = Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);

        client.DefaultRequestHeaders.Remove("Idempotency-Key");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "required-option-0001");
        using var missingOption = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, missingOption.StatusCode);
        using var scope = factory.Services.CreateScope();
        Assert.Empty(await scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>()
            .Orders.ToListAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task OrderListRequiresTenantStaffAndReturnsOnlyTenantSummaries()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();

        using var unauthenticated = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var unauthorized = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "other");
        using var forbidden = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        using var noOrders = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, noOrders.StatusCode);
        using var json = JsonDocument.Parse(await noOrders.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Empty(json.RootElement.GetProperty("items").EnumerateArray());
        using var invalidCursor = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders?cursor=not-a-cursor",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, invalidCursor.StatusCode);
        using var invalidPageSize = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders?pageSize=101",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, invalidPageSize.StatusCode);
    }

    [Fact]
    public async Task StaffOrderRouteSelectsTenantByIdWithoutNeedingThePublicRestaurantHost()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");

        using var response = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task StatusUpdatesRequireIfMatchAndFollowForwardLifecycle()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "status-order-0001");
        var create = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        using var created = JsonDocument.Parse(await create.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var orderId = created.RootElement.GetProperty("id").GetGuid();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");

        using var missingPrecondition = await client.PatchAsJsonAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status", new { status = "Preparing" },
            TestContext.Current.CancellationToken);
        Assert.Equal((HttpStatusCode)428, missingPrecondition.StatusCode);

        using var stale = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Preparing" })
        };
        stale.Headers.TryAddWithoutValidation("If-Match", "\"99\"");
        using var staleResponse = await client.SendAsync(stale, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.PreconditionFailed, staleResponse.StatusCode);

        using var advance = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Preparing" })
        };
        advance.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var advanced = await client.SendAsync(advance, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, advanced.StatusCode);
        Assert.Equal("\"2\"", advanced.Headers.ETag?.Tag);
        using var advancedJson = JsonDocument.Parse(await advanced.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Preparing", advancedJson.RootElement.GetProperty("status").GetString());

        using var skipped = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Completed" })
        };
        skipped.Headers.TryAddWithoutValidation("If-Match", "\"2\"");
        using var skippedResponse = await client.SendAsync(skipped, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Conflict, skippedResponse.StatusCode);

        using var repeated = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Preparing" })
        };
        repeated.Headers.TryAddWithoutValidation("If-Match", "\"2\"");
        using var repeatedResponse = await client.SendAsync(repeated, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, repeatedResponse.StatusCode);
        using var repeatedJson = JsonDocument.Parse(await repeatedResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(2, repeatedJson.RootElement.GetProperty("version").GetInt32());

        using var replay = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, replay.StatusCode);
        using var replayJson = JsonDocument.Parse(await replay.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Pending", replayJson.RootElement.GetProperty("status").GetString());
        Assert.Equal(1, replayJson.RootElement.GetProperty("version").GetInt32());

        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "kitchen");
        using var kitchenCancel = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Cancelled" })
        };
        kitchenCancel.Headers.TryAddWithoutValidation("If-Match", "\"2\"");
        using var kitchenCancelResponse = await client.SendAsync(kitchenCancel, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, kitchenCancelResponse.StatusCode);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        using var managerCancel = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
        {
            Content = JsonContent.Create(new { status = "Cancelled" })
        };
        managerCancel.Headers.TryAddWithoutValidation("If-Match", "\"2\"");
        using var managerCancelResponse = await client.SendAsync(managerCancel, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, managerCancelResponse.StatusCode);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        Assert.Equal(3, await database.OrderOutboxMessages.CountAsync(TestContext.Current.CancellationToken));
        var createdEvent = await database.OrderOutboxMessages.SingleAsync(message => message.EventType == "order.created",
            TestContext.Current.CancellationToken);
        using var eventJson = JsonDocument.Parse(createdEvent.PayloadJson);
        Assert.Equal(createdEvent.Id, eventJson.RootElement.GetProperty("eventId").GetGuid());
        Assert.Equal(seeded.TenantId, eventJson.RootElement.GetProperty("tenantId").GetGuid());
        Assert.Equal("order.created", eventJson.RootElement.GetProperty("eventType").GetString());
    }

    [Fact]
    public async Task StaffOrderListIncludesTicketSnapshotsAndUsesOpaqueStableCursor()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");

        async Task<Guid> CreateAsync(string key)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, "https://bistro.example.test/api/v1/orders")
            {
                Content = JsonContent.Create(new
                {
                    customerName = "Ada",
                    items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
                })
            };
            request.Headers.Add("Idempotency-Key", key);
            using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
            return json.RootElement.GetProperty("id").GetGuid();
        }

        var firstCreated = await CreateAsync("list-order-0001");
        var secondCreated = await CreateAsync("list-order-0002");
        using var firstPage = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders?pageSize=1",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, firstPage.StatusCode);
        using var firstJson = JsonDocument.Parse(await firstPage.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var firstItem = Assert.Single(firstJson.RootElement.GetProperty("items").EnumerateArray());
        AssertTicketSnapshot(firstItem);
        Assert.Equal("Pending", firstItem.GetProperty("status").GetString());
        var firstPageId = firstItem.GetProperty("id").GetGuid();
        Assert.Contains(firstPageId, new[] { firstCreated, secondCreated });
        var cursor = firstJson.RootElement.GetProperty("nextCursor").GetString();
        Assert.False(string.IsNullOrWhiteSpace(cursor));

        using var secondPage = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders?pageSize=1&cursor={Uri.EscapeDataString(cursor!)}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, secondPage.StatusCode);
        using var secondJson = JsonDocument.Parse(await secondPage.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var secondItem = Assert.Single(secondJson.RootElement.GetProperty("items").EnumerateArray());
        AssertTicketSnapshot(secondItem);
        var secondPageId = secondItem.GetProperty("id").GetGuid();
        Assert.NotEqual(firstPageId, secondPageId);
        Assert.Contains(secondPageId, new[] { firstCreated, secondCreated });
        Assert.Null(secondJson.RootElement.GetProperty("nextCursor").GetString());

        void AssertTicketSnapshot(JsonElement order)
        {
            var line = Assert.Single(order.GetProperty("lines").EnumerateArray());
            Assert.Equal(seeded.ProductId, line.GetProperty("productId").GetGuid());
            Assert.Equal("Soup", line.GetProperty("productName").GetString());
            Assert.Equal(1, line.GetProperty("quantity").GetInt32());
            var option = Assert.Single(line.GetProperty("options").EnumerateArray());
            Assert.Equal(seeded.OptionId, option.GetProperty("optionId").GetGuid());
            Assert.Equal("Large", option.GetProperty("name").GetString());
        }
    }

    [Fact]
    public async Task ArchivedCompletedOrderLeavesKitchenListAndRemainsInManagerHistory()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        await factory.SeedOwnerAsync(seeded.OrganizationId, "owner");
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "completed-history-0001");
        using var create = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada Lovelace",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        using var createdJson = JsonDocument.Parse(await create.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var orderId = createdJson.RootElement.GetProperty("id").GetGuid();

        foreach (var (status, version) in new[] { ("Preparing", 1), ("Ready", 2), ("Completed", 3) })
        {
            using var update = new HttpRequestMessage(HttpMethod.Patch,
                $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
            {
                Content = JsonContent.Create(new { status })
            };
            update.Headers.TryAddWithoutValidation("If-Match", $"\"{version}\"");
            using var response = await client.SendAsync(update, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        client.DefaultRequestHeaders.Remove("Idempotency-Key");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "cancelled-history-0001");
        using var cancelledCreate = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Grace Hopper",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        using var cancelledJson = JsonDocument.Parse(await cancelledCreate.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var cancelledId = cancelledJson.RootElement.GetProperty("id").GetGuid();
        using var cancel = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{cancelledId}/status")
        {
            Content = JsonContent.Create(new { status = "Cancelled" })
        };
        cancel.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var cancelledResponse = await client.SendAsync(cancel, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, cancelledResponse.StatusCode);

        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var repository = scope.ServiceProvider.GetRequiredService<WhitePlate.Application.Orders.IOrderRepository>();
            await repository.ArchiveClosedOrdersBeforeAsync(new DateTimeOffset(2026, 1, 2, 0, 0, 0, TimeSpan.Zero),
                TestContext.Current.CancellationToken);
        }

        using var kitchen = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders",
            TestContext.Current.CancellationToken);
        using var kitchenJson = JsonDocument.Parse(await kitchen.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Empty(kitchenJson.RootElement.GetProperty("items").EnumerateArray());

        using var history = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders/history?status=Completed&search=ada&from=2026-01-01&through=2026-01-02&page=1&pageSize=1&sort=createdAt&direction=desc",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, history.StatusCode);
        using var historyJson = JsonDocument.Parse(await history.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(1, historyJson.RootElement.GetProperty("totalCount").GetInt32());
        var historicalOrder = Assert.Single(historyJson.RootElement.GetProperty("items").EnumerateArray());
        Assert.Equal(orderId, historicalOrder.GetProperty("id").GetGuid());
        Assert.Equal("Completed", historicalOrder.GetProperty("status").GetString());
        Assert.Equal("Soup", historicalOrder.GetProperty("lines")[0].GetProperty("productName").GetString());

        using var referenceSearch = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders/history?search={orderId.ToString()[..8].ToUpperInvariant()}",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, referenceSearch.StatusCode);
        using var referenceJson = JsonDocument.Parse(await referenceSearch.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(orderId, Assert.Single(referenceJson.RootElement.GetProperty("items").EnumerateArray())
            .GetProperty("id").GetGuid());

        using var cancelledHistory = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders/history?status=Cancelled&search=Grace&from=2026-01-01&through=2026-01-02",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, cancelledHistory.StatusCode);
        using var cancelledHistoryJson = JsonDocument.Parse(await cancelledHistory.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("Cancelled", Assert.Single(cancelledHistoryJson.RootElement.GetProperty("items").EnumerateArray())
            .GetProperty("status").GetString());

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "owner");
        using var ownerHistory = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders/history?pageSize=1",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ownerHistory.StatusCode);

        using var outOfRangeHistory = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders/history?page=100&pageSize=1",
            TestContext.Current.CancellationToken);
        using var outOfRangeJson = JsonDocument.Parse(await outOfRangeHistory.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        Assert.Equal(2, outOfRangeJson.RootElement.GetProperty("page").GetInt32());
        Assert.Equal(2, outOfRangeJson.RootElement.GetProperty("totalCount").GetInt32());
        using var ownerHistoryJson = JsonDocument.Parse(await ownerHistory.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(2, ownerHistoryJson.RootElement.GetProperty("totalCount").GetInt32());

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "kitchen");
        using var forbidden = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders/history",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);
    }

    [Fact]
    public async Task StaffOrderReadsAndUpdatesCannotCrossTheResolvedTenantBoundary()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();

        async Task<Guid> CreateAsync(string host, string key, Guid productId, Guid[] optionIds)
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"https://{host}/api/v1/orders")
            {
                Content = JsonContent.Create(new
                {
                    customerName = "Ada",
                    items = new[] { new { productId, quantity = 1, optionIds } }
                })
            };
            request.Headers.Add("Idempotency-Key", key);
            using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
            return json.RootElement.GetProperty("id").GetGuid();
        }

        await CreateAsync("bistro.example.test", "tenant-a-order-1", seeded.ProductId, [seeded.OptionId]);
        var foreignOrderId = await CreateAsync("other.example.test", "tenant-b-order-1", seeded.OtherProductId, []);
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");

        using var list = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, list.StatusCode);
        using var listJson = JsonDocument.Parse(await list.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Single(listJson.RootElement.GetProperty("items").EnumerateArray());

        using var foreignUpdate = new HttpRequestMessage(HttpMethod.Patch,
            $"/api/v1/tenants/{seeded.TenantId}/orders/{foreignOrderId}/status")
        {
            Content = JsonContent.Create(new { status = "Preparing" })
        };
        foreignUpdate.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var response = await client.SendAsync(foreignUpdate, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed class OrdersFactory : WebApplicationFactory<Program>
    {
        private readonly SqliteConnection connection = new("Data Source=:memory:");
        private readonly ManualTimeProvider timeProvider = new(new DateTimeOffset(2026, 1, 1, 0, 0, 0, TimeSpan.Zero));
        private readonly int checkoutPermitLimit;

        public OrdersFactory(int checkoutPermitLimit = 10) => this.checkoutPermitLimit = checkoutPermitLimit;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            connection.Open();
            builder.UseEnvironment("Production");
            builder.UseSetting("Authentication:Issuer", "https://localhost:3000");
            builder.UseSetting("Authentication:Audience", "whiteplate-api");
            builder.ConfigureLogging(logging => logging.ClearProviders());
            builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["CheckoutRateLimit:PermitLimit"] = checkoutPermitLimit.ToString(),
                    ["CheckoutRateLimit:WindowSeconds"] = "60"
                }));
            builder.ConfigureServices(services =>
            {
                var dispatcher = services.FirstOrDefault(descriptor => descriptor.ServiceType == typeof(IHostedService) &&
                    descriptor.ImplementationType == typeof(OrderOutboxDispatcher));
                if (dispatcher is not null) services.Remove(dispatcher);
                var archiveDispatcher = services.FirstOrDefault(descriptor => descriptor.ServiceType == typeof(IHostedService) &&
                    descriptor.ImplementationType == typeof(OrderArchiveDispatcher));
                if (archiveDispatcher is not null) services.Remove(archiveDispatcher);
                services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthenticationHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthenticationHandler.SchemeName;
                }).AddScheme<AuthenticationSchemeOptions, TestAuthenticationHandler>(
                    TestAuthenticationHandler.SchemeName, _ => { });
                services.RemoveAll<TimeProvider>();
                services.AddSingleton<TimeProvider>(timeProvider);
                services.PostConfigure<TenantHostOptions>(options => options.BaseDomain = "example.test");
                services.RemoveAll<DbContextOptions<WhitePlateDbContext>>();
                services.RemoveAll<IDbContextOptionsConfiguration<WhitePlateDbContext>>();
                services.AddDbContext<WhitePlateDbContext>(options => options.UseSqlite(connection));
            });
        }

        public async Task<(Guid TenantId, Guid ProductId, Guid OptionId, Guid OtherProductId, Guid OrganizationId)> SeedAsync()
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
            var organization = Organization.Create("Orders Test");
            database.Organizations.Add(organization);
            var tenant = Tenant.Create(organization.Id, "Bistro", "bistro", "EUR");
            var otherTenant = Tenant.Create(organization.Id, "Other Bistro", "other", "USD");
            database.Tenants.AddRange(tenant, otherTenant);
            var category = MenuCategory.Create(tenant.Id, "Mains", 0);
            var otherCategory = MenuCategory.Create(otherTenant.Id, "Mains", 0);
            database.MenuCategories.AddRange(category, otherCategory);
            var product = Product.Create(tenant.Id, category.Id, "Soup", null, 8.50m, 10m, 0);
            var otherProduct = Product.Create(otherTenant.Id, otherCategory.Id, "Pie", null, 7m, 0m, 0);
            database.Products.AddRange(product, otherProduct);
            var group = ProductOptionGroup.Create(tenant.Id, product.Id, "Size", 1, 2, 0);
            database.ProductOptionGroups.Add(group);
            var option = ProductOption.Create(tenant.Id, group.Id, "Large", 1.25m, 0);
            database.ProductOptions.Add(option);
            database.PromotionDiscounts.Add(PromotionDiscount.Create(tenant.Id, "SAVE", "Save two", DiscountKind.FixedAmount, 2m));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
            return (tenant.Id, product.Id, option.Id, otherProduct.Id, organization.Id);
        }

        public async Task SeedOwnerAsync(Guid organizationId, string subject)
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            database.OrganizationOwnerMemberships.Add(OrganizationOwnerMembership.Create(organizationId,
                ExternalIdentity.Create("https://identity.example.test/", subject)));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        public async Task SeedMembershipAsync(Guid tenantId, string subject, RestaurantRole role)
        {
            using var scope = Services.CreateScope();
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            database.RestaurantMemberships.Add(RestaurantMembership.Create(tenantId,
                ExternalIdentity.Create("https://identity.example.test/", subject), role));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        public void AdvanceTime(TimeSpan duration) => timeProvider.Advance(duration);

        protected override void Dispose(bool disposing)
        {
            base.Dispose(disposing);
            if (disposing) connection.Dispose();
        }
    }

    private sealed class ManualTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        private DateTimeOffset now = utcNow;
        public override DateTimeOffset GetUtcNow() => now;
        public void Advance(TimeSpan duration) => now = now.Add(duration);
    }

    private sealed class TestAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string SchemeName = "WhitePlateTest";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var subject = Request.Headers.Authorization.ToString().Split(' ').LastOrDefault();
            if (string.IsNullOrWhiteSpace(subject)) return Task.FromResult(AuthenticateResult.NoResult());
            var identity = new ClaimsIdentity([
                new Claim("iss", "https://identity.example.test/"), new Claim("sub", subject)
            ], SchemeName);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
        }
    }

}
