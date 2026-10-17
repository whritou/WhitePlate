using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task CancellationRequiresARecordedReasonAndOrderReadsExposeOnlySafeEmailEvents()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "k3-cancel-reason-0001");

        using var created = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada Lovelace",
            customerEmail = "ada@example.test",
            emailUpdatesConsented = true,
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        using var createdJson = JsonDocument.Parse(await created.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var orderId = createdJson.RootElement.GetProperty("id").GetGuid();

        using var missingReason = await UpdateAsync(new { status = "Cancelled" });
        Assert.Equal(HttpStatusCode.BadRequest, missingReason.StatusCode);
        using var invalidReason = await UpdateAsync(new { status = "Cancelled", cancellationReason = "CustomerRequestWithNote" });
        Assert.Equal(HttpStatusCode.BadRequest, invalidReason.StatusCode);
        using var cancelled = await UpdateAsync(new { status = "Cancelled", cancellationReason = "ItemUnavailable" });
        Assert.True(cancelled.StatusCode == HttpStatusCode.OK,
            await cancelled.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));

        using var list = await client.GetAsync($"/api/v1/tenants/{seeded.TenantId}/orders?status=Cancelled",
            TestContext.Current.CancellationToken);
        Assert.True(list.StatusCode == HttpStatusCode.OK,
            await list.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var listText = await list.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        using var listJson = JsonDocument.Parse(listText);
        var order = Assert.Single(listJson.RootElement.GetProperty("items").EnumerateArray());
        Assert.Equal(orderId, order.GetProperty("id").GetGuid());
        Assert.Equal("ItemUnavailable", order.GetProperty("cancellationReason").GetString());
        AssertSafeEmailNotification(order, listText);

        using var history = await client.GetAsync(
            $"/api/v1/tenants/{seeded.TenantId}/orders/history?status=Cancelled&page=1&pageSize=25",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, history.StatusCode);
        using var historyJson = JsonDocument.Parse(await history.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        var historicalOrder = Assert.Single(historyJson.RootElement.GetProperty("items").EnumerateArray());
        Assert.Equal("ItemUnavailable", historicalOrder.GetProperty("cancellationReason").GetString());
        Assert.Equal("Pending", Assert.Single(historicalOrder.GetProperty("emailNotifications").EnumerateArray())
            .GetProperty("status").GetString());

        async Task<HttpResponseMessage> UpdateAsync(object body)
        {
            using var request = new HttpRequestMessage(HttpMethod.Patch,
                $"/api/v1/tenants/{seeded.TenantId}/orders/{orderId}/status")
            {
                Content = JsonContent.Create(body)
            };
            request.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
            return await client.SendAsync(request, TestContext.Current.CancellationToken);
        }
    }

    private static void AssertSafeEmailNotification(JsonElement order, string responseText)
    {
        var notification = Assert.Single(order.GetProperty("emailNotifications").EnumerateArray());
        Assert.Equal("order.created", notification.GetProperty("eventType").GetString());
        Assert.Equal("Pending", notification.GetProperty("status").GetString());
        Assert.True(notification.TryGetProperty("createdAt", out _));
        Assert.Equal(JsonValueKind.Null, notification.GetProperty("acceptedAt").ValueKind);
        Assert.DoesNotContain("ada@example.test", responseText, StringComparison.OrdinalIgnoreCase);
        foreach (var sensitiveField in new[]
        {
            "recipientEmail", "providerMessageId", "subjectSnapshot", "htmlSnapshot", "textSnapshot",
            "attemptCount", "lastFailureCode"
        })
            Assert.DoesNotContain(sensitiveField, responseText, StringComparison.OrdinalIgnoreCase);
    }
}
