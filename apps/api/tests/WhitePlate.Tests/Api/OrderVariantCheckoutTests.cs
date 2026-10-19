using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task CheckoutPersistsDistinctVariantsAndRejectsDuplicateSelections()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync(includeVariantOption: true);
        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var small = await database.ProductOptions.SingleAsync(option => option.TenantId == seeded.TenantId &&
            option.Name == "Small", TestContext.Current.CancellationToken);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "variant-checkout-0001");
        var items = new[]
        {
            new { productId = seeded.ProductId, quantity = 2, optionIds = new[] { seeded.OptionId } },
            new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { small.Id } }
        };
        using var created = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders",
            new { customerName = "Ada", items }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        using var json = JsonDocument.Parse(await created.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal(2, json.RootElement.GetProperty("lines").GetArrayLength());
        Assert.Equal(28.50m, json.RootElement.GetProperty("subtotal").GetDecimal());
        Assert.Equal(31.35m, json.RootElement.GetProperty("total").GetDecimal());
        Assert.Equal(2, await database.Set<OrderLine>().CountAsync(TestContext.Current.CancellationToken));

        client.DefaultRequestHeaders.Remove("Idempotency-Key");
        client.DefaultRequestHeaders.Add("Idempotency-Key", "variant-checkout-0002");
        using var duplicate = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders",
            new { customerName = "Ada", items = new[] { items[0], items[0] } }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
        Assert.Equal(1, await database.Orders.CountAsync(TestContext.Current.CancellationToken));
    }
}
