using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task DashboardMetricsUseRestaurantLocalDaysRetainedOrdersAndLifecycleSnapshots()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync(timeZone: "Europe/Paris");
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        await factory.SeedMembershipAsync(seeded.OtherTenantId, "manager", RestaurantRole.Manager);
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");

        async Task<Guid> CreateOrder(string name, string key)
        {
            client.DefaultRequestHeaders.Remove("Idempotency-Key");
            client.DefaultRequestHeaders.Add("Idempotency-Key", key);
            using var response = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
            {
                customerName = name,
                items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
            }, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
            return json.RootElement.GetProperty("id").GetGuid();
        }

        async Task UpdateOrder(Guid orderId, string status, int version)
        {
            using var request = new HttpRequestMessage(HttpMethod.Patch,
                $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
            {
                Content = JsonContent.Create(new { status })
            };
            request.Headers.TryAddWithoutValidation("If-Match", $"\"{version}\"");
            using var response = await client.SendAsync(request, TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        var yesterdayCompleted = await CreateOrder("Yesterday completed", "metrics-yesterday-completed");
        await UpdateOrder(yesterdayCompleted, "Preparing", 1);
        factory.AdvanceTime(TimeSpan.FromMinutes(12));
        await UpdateOrder(yesterdayCompleted, "Ready", 2);
        await UpdateOrder(yesterdayCompleted, "Completed", 3);
        var yesterdayCancelled = await CreateOrder("Yesterday cancelled", "metrics-yesterday-cancelled");
        await UpdateOrder(yesterdayCancelled, "Cancelled", 1);
        factory.AdvanceTime(TimeSpan.FromHours(22).Add(TimeSpan.FromMinutes(48)));

        var todayReady = await CreateOrder("Today ready", "metrics-today-ready");
        await UpdateOrder(todayReady, "Preparing", 1);
        factory.AdvanceTime(TimeSpan.FromMinutes(12));
        await UpdateOrder(todayReady, "Ready", 2);
        client.DefaultRequestHeaders.Remove("Idempotency-Key");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "metrics-other-tenant");
        using (var otherTenantOrder = await client.PostAsJsonAsync("https://other.example.test/api/v1/orders", new
        {
            customerName = "Other tenant",
            items = new[] { new { productId = seeded.OtherProductId, quantity = 3, optionIds = Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken))
            Assert.Equal(HttpStatusCode.Created, otherTenantOrder.StatusCode);
        await using (var scope = factory.Services.CreateAsyncScope())
        {
            var repository = scope.ServiceProvider.GetRequiredService<WhitePlate.Application.Orders.IOrderRepository>();
            await repository.ArchiveClosedOrdersBeforeAsync(new DateTimeOffset(2026, 1, 3, 0, 0, 0, TimeSpan.Zero),
                TestContext.Current.CancellationToken);
        }

        using var response = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/dashboard/metrics",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("no-store", response.Headers.CacheControl?.ToString());
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var metrics = json.RootElement;
        Assert.Equal("Europe/Paris", metrics.GetProperty("timeZone").GetString());
        Assert.Equal("2026-01-02", metrics.GetProperty("businessDate").GetString());
        Assert.Equal("2026-01-01", metrics.GetProperty("comparisonDate").GetString());
        Assert.Equal("EUR", metrics.GetProperty("currency").GetString());
        Assert.Equal(1, metrics.GetProperty("orderCount").GetInt32());
        Assert.Equal(2, metrics.GetProperty("comparisonOrderCount").GetInt32());
        Assert.Equal(10.73m, metrics.GetProperty("orderValue").GetDecimal());
        Assert.Equal(10.73m, metrics.GetProperty("comparisonOrderValue").GetDecimal());
        Assert.Equal(1, metrics.GetProperty("activeOrders").GetProperty("total").GetInt32());
        Assert.Equal(1, metrics.GetProperty("activeOrders").GetProperty("ready").GetInt32());
        Assert.Equal(12m, metrics.GetProperty("averagePreparationMinutes").GetDecimal());
        Assert.Equal(1, metrics.GetProperty("preparationSampleCount").GetInt32());
        Assert.Equal(24, metrics.GetProperty("hourlyOrders").GetArrayLength());
        Assert.Equal(1, metrics.GetProperty("hourlyOrders")[0].GetProperty("current").GetInt32());
        Assert.Equal(2, metrics.GetProperty("hourlyOrders")[1].GetProperty("previous").GetInt32());
        var seller = Assert.Single(metrics.GetProperty("topSellingItems").EnumerateArray());
        Assert.Equal("Soup", seller.GetProperty("productName").GetString());
        Assert.Equal(1, seller.GetProperty("quantity").GetInt32());

        using var otherTenantMetrics = await client.GetAsync(
            $"/api/v1/tenants/{seeded.OtherTenantId}/dashboard/metrics",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, otherTenantMetrics.StatusCode);
        using var otherTenantJson = JsonDocument.Parse(await otherTenantMetrics.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        Assert.Equal("USD", otherTenantJson.RootElement.GetProperty("currency").GetString());
        Assert.Equal(1, otherTenantJson.RootElement.GetProperty("orderCount").GetInt32());
        Assert.Equal(21m, otherTenantJson.RootElement.GetProperty("orderValue").GetDecimal());

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "kitchen");
        using var kitchenResponse = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/dashboard/metrics",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, kitchenResponse.StatusCode);
        using var kitchenJson = JsonDocument.Parse(await kitchenResponse.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(JsonValueKind.Null, kitchenJson.RootElement.GetProperty("orderValue").ValueKind);
        Assert.Equal(JsonValueKind.Null, kitchenJson.RootElement.GetProperty("comparisonOrderValue").ValueKind);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "other");
        using var foreignResponse = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/dashboard/metrics",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Forbidden, foreignResponse.StatusCode);
        client.DefaultRequestHeaders.Authorization = null;
        using var anonymousResponse = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/dashboard/metrics",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);
    }

    [Fact]
    public async Task DashboardMetricsRepresentAnEmptyRestaurantWithoutInventedSamples()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");

        using var response = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/dashboard/metrics",
            TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var metrics = json.RootElement;
        Assert.Equal(0, metrics.GetProperty("orderCount").GetInt32());
        Assert.Equal(0m, metrics.GetProperty("orderValue").GetDecimal());
        Assert.Equal(JsonValueKind.Null, metrics.GetProperty("averagePreparationMinutes").ValueKind);
        Assert.Equal(0, metrics.GetProperty("preparationSampleCount").GetInt32());
        Assert.Empty(metrics.GetProperty("topSellingItems").EnumerateArray());
        Assert.All(metrics.GetProperty("hourlyOrders").EnumerateArray(), hour =>
        {
            Assert.Equal(0, hour.GetProperty("current").GetInt32());
            Assert.Equal(0, hour.GetProperty("previous").GetInt32());
        });
    }
}
