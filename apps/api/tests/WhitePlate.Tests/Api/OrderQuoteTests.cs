using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Theory]
    [InlineData("UNKNOWN", 1, true)]
    [InlineData(null, 0, true)]
    [InlineData(null, 1, false)]
    public async Task QuoteValidatesDiscountQuantityAndRequiredOptions(string? code, int quantity, bool includeOption)
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        using var response = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders/quote", new
        {
            discountCode = code,
            items = new[] { new { productId = seeded.ProductId, quantity,
                optionIds = includeOption ? new[] { seeded.OptionId } : Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task QuoteMatchesCheckoutWithoutCreatingAnOrderAndRejectsForeignProducts()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var client = factory.CreateClient();
        var payload = new
        {
            customerName = "Ada", discountCode = "save",
            items = new[] { new { productId = seeded.ProductId, quantity = 2, optionIds = new[] { seeded.OptionId } } }
        };
        using var quote = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders/quote", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, quote.StatusCode);
        using var json = JsonDocument.Parse(await quote.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.False(json.RootElement.TryGetProperty("id", out _));
        Assert.False(json.RootElement.TryGetProperty("customerName", out _));
        Assert.Equal(19.25m, json.RootElement.GetProperty("total").GetDecimal());
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        Assert.Equal(0, await database.Orders.CountAsync(TestContext.Current.CancellationToken));
        Assert.Equal(0, await database.OrderOutboxMessages.CountAsync(TestContext.Current.CancellationToken));
        Assert.Equal(0, await database.OrderIdempotencyRecords.CountAsync(TestContext.Current.CancellationToken));
        Assert.Equal(0, await database.PickupSlotReservations.CountAsync(TestContext.Current.CancellationToken));
        client.DefaultRequestHeaders.Add("Idempotency-Key", "quote-comparison-0001");
        using var created = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        using var receipt = JsonDocument.Parse(await created.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        foreach (var field in new[] { "subtotal", "discountAmount", "taxAmount", "total" })
            Assert.Equal(receipt.RootElement.GetProperty(field).GetDecimal(), json.RootElement.GetProperty(field).GetDecimal());
        using var foreign = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders/quote", new
        {
            items = new[] { new { productId = seeded.OtherProductId, quantity = 1, optionIds = Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
    }
}
