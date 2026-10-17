using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WhitePlate.Api.Configuration;
using WhitePlate.Api.Realtime;
using WhitePlate.Application.Orders;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Orders;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Api;

public sealed partial class OrdersEndpointTests
{
    [Fact]
    public async Task OptedInCheckoutCreatesSeparateEventDeliveriesAndKeepsEmailPrivate()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Idempotency-Key", "order-email-events-0001");
        var payload = new
        {
            customerName = "Ada <script>",
            customerEmail = "Ada@example.com",
            emailUpdatesConsented = true,
            items = new[] { new { productId = seeded.ProductId, quantity = 1, optionIds = new[] { seeded.OptionId } } }
        };

        using var created = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var receiptText = await created.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
        Assert.DoesNotContain("customerEmail", receiptText, StringComparison.OrdinalIgnoreCase);
        using var receipt = JsonDocument.Parse(receiptText);
        var orderId = receipt.RootElement.GetProperty("id").GetGuid();

        using (var scope = factory.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            var order = await database.Orders.Include(item => item.Lines).ThenInclude(line => line.Options)
                .SingleAsync(item => item.Id == orderId, TestContext.Current.CancellationToken);
            var tenant = await database.Tenants.SingleAsync(item => item.Id == order.TenantId, TestContext.Current.CancellationToken);
            var bannerAssetId = Guid.NewGuid();
            Assert.True(tenant.SetPublishedTheme(new ThemePublicationSnapshot(tenant.GetThemeDraft(), null, null,
                bannerAssetId, tenant.ThemeDraftVersion, factory.CurrentTime), tenant.ThemeDraftVersion,
                tenant.ThemePublicationVersion));
            tenant.UpdateEstablishment(new EstablishmentInput(tenant.Name, TimeZone: tenant.TimeZone,
                PickupInstructions: new Dictionary<string, string?> { ["en"] = "Use the side door." }));
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
            Assert.Equal("ada@example.com", order.CustomerEmail);
            Assert.Equal(factory.CurrentTime, order.EmailUpdatesConsentedAt);
            Assert.NotNull(order.EmailTrackingTokenHash);
            Assert.Single(await database.OrderEmailDeliveries.ToListAsync(TestContext.Current.CancellationToken));

            var capability = scope.ServiceProvider.GetRequiredService<IEmailTrackingCapability>()
                .Create(order.TenantId, order.Id, order.TrackingTokenExpiresAt!.Value)!;
            Assert.Equal(capability.TokenHash, order.EmailTrackingTokenHash);
            var delivery = await database.OrderEmailDeliveries.SingleAsync(item => item.OrderId == orderId,
                TestContext.Current.CancellationToken);
            var email = OrderEmailRenderer.Render(order, tenant, delivery,
                scope.ServiceProvider.GetRequiredService<IEmailTrackingCapability>(),
                new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["OrderEmails:StorefrontUrlTemplate"] = "https://{subdomain}.example.test"
                }).Build());
            Assert.Contains("Ada &lt;script&gt;", email.Html, StringComparison.Ordinal);
            Assert.DoesNotContain("<script>", email.Html, StringComparison.Ordinal);
            Assert.Contains("Ada <script>", email.Text, StringComparison.Ordinal);
            Assert.Contains("Soup", email.Text, StringComparison.Ordinal);
            Assert.Contains("Use the side door.", email.Text, StringComparison.Ordinal);
            Assert.Contains("https://bistro.example.test/en/order/", email.Html, StringComparison.Ordinal);
            Assert.Contains("https://bistro.example.test/api/public/brand-assets/banner", email.Html,
                StringComparison.Ordinal);
            var sanitizedSnapshot = OrderEmailRenderer.HideTrackingToken(email.Html, email.TrackingToken);
            Assert.DoesNotContain(email.TrackingToken!, sanitizedSnapshot, StringComparison.Ordinal);
            Assert.Contains(OrderEmailRenderer.TrackingTokenPlaceholder, sanitizedSnapshot, StringComparison.Ordinal);
            using var tracking = await client.PostAsJsonAsync(
                $"https://bistro.example.test/api/v1/orders/{orderId}/tracking", new { token = capability.Token },
                TestContext.Current.CancellationToken);
            Assert.Equal(HttpStatusCode.OK, tracking.StatusCode);
            var trackingText = await tracking.Content.ReadAsStringAsync(TestContext.Current.CancellationToken);
            Assert.DoesNotContain("ada@example.com", trackingText, StringComparison.OrdinalIgnoreCase);
        }

        using var replay = await client.PostAsJsonAsync("https://bistro.example.test/api/v1/orders", payload,
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Created, replay.StatusCode);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        await AdvanceAsync("Preparing", 1);
        await AdvanceAsync("Ready", 2);

        using (var scope = factory.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
            var deliveries = (await database.OrderEmailDeliveries.ToListAsync(TestContext.Current.CancellationToken))
                .OrderBy(item => item.CreatedAt).ToArray();
            Assert.Equal(new[] { "order.created", "order.preparing", "order.ready" },
                deliveries.Select(item => item.EventType));
            Assert.All(deliveries, item => Assert.Equal("ada@example.com", item.RecipientEmail));
            Assert.Equal(3, await database.OrderOutboxMessages.CountAsync(TestContext.Current.CancellationToken));
        }

        await AdvanceAsync("Completed", 3);
        using var cleanupScope = factory.Services.CreateScope();
        var cleanup = cleanupScope.ServiceProvider.GetRequiredService<IOrderRepository>();
        await cleanup.CleanExpiredOrderEmailDataAsync(factory.CurrentTime, TestContext.Current.CancellationToken);
        var cleaned = cleanupScope.ServiceProvider.GetRequiredService<WhitePlateDbContext>();
        var finalOrder = await cleaned.Orders.SingleAsync(item => item.Id == orderId, TestContext.Current.CancellationToken);
        Assert.Null(finalOrder.CustomerEmail);
        Assert.Null(finalOrder.EmailUpdatesConsentedAt);
        Assert.All(await cleaned.OrderEmailDeliveries.ToListAsync(TestContext.Current.CancellationToken), item =>
        {
            Assert.Equal("ada@example.com", item.RecipientEmail);
            Assert.Equal(OrderEmailDeliveryStatus.Pending, item.Status);
        });

        await cleanup.CleanExpiredOrderEmailDataAsync(factory.CurrentTime.AddDays(31),
            TestContext.Current.CancellationToken);
        Assert.Null(finalOrder.EmailTrackingTokenHash);
        Assert.All(await cleaned.OrderEmailDeliveries.ToListAsync(TestContext.Current.CancellationToken), item =>
        {
            Assert.Null(item.RecipientEmail);
            Assert.Equal(OrderEmailDeliveryStatus.Failed, item.Status);
        });

        async Task AdvanceAsync(string status, int version)
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
    }

    [Fact]
    public async Task ResendUsesTheOrderEventIdAsProviderIdempotencyKey()
    {
        var handler = new CapturingEmailHandler();
        var factory = new StaticHttpClientFactory(new HttpClient(handler));
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["RESEND_API_KEY"] = "server-only-test-key",
            ["RESEND_FROM_EMAIL"] = "orders@example.test"
        }).Build();
        var sender = new ResendOrderEmailSender(factory, configuration);
        var eventId = Guid.NewGuid();

        var providerMessageId = await sender.SendAsync(eventId, "guest@example.test", "Order received",
            "<p>Ready</p>", "Ready", TestContext.Current.CancellationToken);

        Assert.Equal("resend-message-1", providerMessageId);
        Assert.Equal($"order-event/{eventId:N}", handler.IdempotencyKey);
        Assert.Equal("Bearer server-only-test-key", handler.Authorization);
        Assert.Contains("guest@example.test", handler.Body, StringComparison.Ordinal);
        Assert.Contains("orders@example.test", handler.Body, StringComparison.Ordinal);
    }

    [Fact]
    public async Task RestaurantEmailTemplatesAreTenantScopedAndUseOptimisticConcurrency()
    {
        using var factory = new OrdersFactory();
        var seeded = await factory.SeedAsync();
        await factory.SeedMembershipAsync(seeded.TenantId, "manager", RestaurantRole.Manager);
        using var client = factory.CreateClient();
        var path = $"/api/v1/tenants/{seeded.TenantId}/order-email-settings";

        using var unauthenticated = await client.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "manager");
        using var loaded = await client.GetAsync(path, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, loaded.StatusCode);
        Assert.Equal("\"1\"", loaded.Headers.ETag?.Tag);
        var settings = await loaded.Content.ReadFromJsonAsync<OrderEmailSettingsDto>(
            cancellationToken: TestContext.Current.CancellationToken);
        Assert.NotNull(settings);
        var template = settings.Templates.Single();
        var updated = template with
        {
            OrderCreated = template.OrderCreated with { Heading = "Thanks, {{customerName}}" }
        };
        using var request = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(new { templates = new[] { updated } })
        };
        request.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var saved = await client.SendAsync(request, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        Assert.Equal("\"2\"", saved.Headers.ETag?.Tag);

        using var stale = new HttpRequestMessage(HttpMethod.Put, path)
        {
            Content = JsonContent.Create(new { templates = new[] { updated } })
        };
        stale.Headers.TryAddWithoutValidation("If-Match", "\"1\"");
        using var conflict = await client.SendAsync(stale, TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.PreconditionFailed, conflict.StatusCode);

        using var foreign = await client.GetAsync($"/api/v1/tenants/{seeded.OtherTenantId}/order-email-settings",
            TestContext.Current.CancellationToken);
        Assert.Equal(HttpStatusCode.NotFound, foreign.StatusCode);
    }

    private sealed class StaticHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class CapturingEmailHandler : HttpMessageHandler
    {
        public string? IdempotencyKey { get; private set; }
        public string? Authorization { get; private set; }
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            IdempotencyKey = request.Headers.GetValues("Idempotency-Key").Single();
            Authorization = request.Headers.Authorization?.ToString();
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"id\":\"resend-message-1\"}")
            };
        }
    }
}
