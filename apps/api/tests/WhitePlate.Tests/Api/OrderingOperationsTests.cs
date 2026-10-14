using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task ManagersAndOrganizationOwnersCanReadAndUpdateOrderingOperationsWithAnEntityTag()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "manager");
        var path = $"/api/v1/tenants/{seeded.TenantId}/ordering-operations";

        using var initial = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, initial.StatusCode);
        Assert.Equal("\"1\"", initial.Headers.ETag?.Tag);
        using var initialJson = JsonDocument.Parse(await initial.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        Assert.True(initialJson.RootElement.GetProperty("acceptingOrders").GetBoolean());
        Assert.False(initialJson.RootElement.GetProperty("rushHoldEnabled").GetBoolean());

        using var update = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(new { acceptingOrders = false, rushHoldEnabled = true })
        };
        update.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var updated = await client.SendAsync(update, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        Assert.Equal("\"2\"", updated.Headers.ETag?.Tag);
        using var updatedJson = JsonDocument.Parse(await updated.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        Assert.False(updatedJson.RootElement.GetProperty("acceptingOrders").GetBoolean());
        Assert.True(updatedJson.RootElement.GetProperty("rushHoldEnabled").GetBoolean());

        await factory.SeedOwnerAsync(seeded.OrganizationId, "owner");
        using var owner = factory.CreateClient();
        owner.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "owner");
        using var ownerUpdate = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(new { acceptingOrders = true, rushHoldEnabled = true })
        };
        ownerUpdate.Headers.TryAddWithoutValidation("If-Match", "\"2\"");
        using var ownerResponse = await owner.SendAsync(ownerUpdate, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, ownerResponse.StatusCode);
        Assert.Equal("\"3\"", ownerResponse.Headers.ETag?.Tag);

        using var staleUpdate = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(new { acceptingOrders = true, rushHoldEnabled = false })
        };
        staleUpdate.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var stale = await client.SendAsync(staleUpdate, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.PreconditionFailed, stale.StatusCode);
    }

    [Fact]
    public async Task KitchenCanReadOrderingOperationsButCannotChangeThem()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "kitchen", RestaurantRole.Kitchen);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "kitchen");
        var path = $"/api/v1/tenants/{seeded.TenantId}/ordering-operations";

        using var read = await client.GetAsync(path, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, read.StatusCode);

        using var update = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(new { acceptingOrders = false, rushHoldEnabled = false })
        };
        update.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var response = await client.SendAsync(update, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task EmergencyPauseHidesPickupSlotsAndRejectsAnExistingCartAtCheckout()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        using var guest = factory.CreateClient();
        const string existingOrderKey = "pause-preserves-order-0001";
        var existingOrder = new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        };
        guest.DefaultRequestHeaders.Add("Idempotency-Key", existingOrderKey);
        using var created = await guest.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", existingOrder,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        using var createdJson = JsonDocument.Parse(await created.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        var existingOrderId = createdJson.RootElement.GetProperty("id").GetGuid();

        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var manager = factory.CreateClient();
        manager.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "manager");
        using var update = new HttpRequestMessage(HttpMethod.Put,
            $"/api/v1/tenants/{seeded.TenantId}/ordering-operations")
        {
            Content = JsonContent.Create(new { acceptingOrders = false, rushHoldEnabled = false })
        };
        update.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var updated = await manager.SendAsync(update, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        using var availability = await guest.GetAsync("https://bistro.example.test/api/v1/pickup-slots",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, availability.StatusCode);
        using var availabilityJson = JsonDocument.Parse(await availability.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        Assert.Equal("orders_paused", availabilityJson.RootElement.GetProperty("state").GetString());
        Assert.Empty(availabilityJson.RootElement.GetProperty("slots").EnumerateArray());

        guest.DefaultRequestHeaders.Remove("Idempotency-Key");
        guest.DefaultRequestHeaders.Add("Idempotency-Key", "paused-checkout-0001");
        using var checkout = await guest.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", new
        {
            customerName = "Ada",
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = Array.Empty<Guid>() } }
        }, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Conflict, checkout.StatusCode);

        guest.DefaultRequestHeaders.Remove("Idempotency-Key");
        guest.DefaultRequestHeaders.Add("Idempotency-Key", existingOrderKey);
        using var replay = await guest.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", existingOrder,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, replay.StatusCode);
        using var replayJson = JsonDocument.Parse(await replay.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));
        Assert.Equal(existingOrderId, replayJson.RootElement.GetProperty("id").GetGuid());

        using var scope = factory.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        Assert.Equal(1, await database.Orders.CountAsync(TestContext.Current.CancellationToken));
        Assert.Single(await database.PickupSlotReservations.ToListAsync(TestContext.Current.CancellationToken));
        Assert.Equal(1, await database.PickupSlotUsages.SumAsync(usage => usage.ReservedCount,
            TestContext.Current.CancellationToken));

        using var resume = new HttpRequestMessage(HttpMethod.Put,
            $"/api/v1/tenants/{seeded.TenantId}/ordering-operations")
        {
            Content = JsonContent.Create(new { acceptingOrders = true, rushHoldEnabled = false })
        };
        resume.Headers.TryAddWithoutValidation("If-Match", "\"2\"");
        using var resumed = await manager.SendAsync(resume, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, resumed.StatusCode);

        guest.DefaultRequestHeaders.Remove("Idempotency-Key");
        guest.DefaultRequestHeaders.Add("Idempotency-Key", "after-pause-resume-0001");
        using var acceptedAfterResume = await guest.PostAsJsonAsync("https://bistro.example.test/api/v1/orders",
            new
            {
                customerName = "Grace",
                items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
            }, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, acceptedAfterResume.StatusCode);
    }

    [Fact]
    public async Task RushHoldAddsTenMinutesToNewPickupAvailability()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        factory.AdvanceTime(TimeSpan.FromMinutes(5));
        using var manager = factory.CreateClient();
        manager.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "manager");
        using var update = new HttpRequestMessage(HttpMethod.Put,
            $"/api/v1/tenants/{seeded.TenantId}/ordering-operations")
        {
            Content = JsonContent.Create(new { acceptingOrders = true, rushHoldEnabled = true })
        };
        update.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var updated = await manager.SendAsync(update, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);

        using var guest = factory.CreateClient();
        using var availability = await guest.GetAsync("https://bistro.example.test/api/v1/pickup-slots",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, availability.StatusCode);
        using var json = JsonDocument.Parse(await availability.Content.ReadAsStringAsync(
            TestContext.Current.CancellationToken));

        Assert.Equal(10, json.RootElement.GetProperty("rushBufferMinutes").GetInt32());
        Assert.Equal(new DateTimeOffset(2026, 1, 1, 0, 45, 0, TimeSpan.Zero),
            json.RootElement.GetProperty("slots")[0].GetProperty("startsAt").GetDateTimeOffset());
    }
}
