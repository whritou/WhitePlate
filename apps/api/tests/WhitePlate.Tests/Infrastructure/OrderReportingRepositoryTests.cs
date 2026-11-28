using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Orders;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Orders;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class OrderReportingRepositoryTests
{
    // America/Santiago starts daylight saving time at local midnight on the first Sunday of September
    // (00:00 becomes 01:00), so that local midnight does not exist. This is present in the IANA tzdata
    // used on Linux and in the Windows "Pacific SA Standard Time" mapping used through ICU.
    private const string SkippedMidnightZoneId = "America/Santiago";

    [Fact]
    public void LocalDayStartUsesTheFirstValidMinuteWhenMidnightIsSkipped()
    {
        var zone = TimeZoneInfo.FindSystemTimeZoneById(SkippedMidnightZoneId);
        var date = FindSkippedMidnight(zone);
        var midnight = date.ToDateTime(TimeOnly.MinValue);
        Assert.Throws<ArgumentException>(() => TimeZoneInfo.ConvertTimeToUtc(midnight, zone));

        var start = RestaurantLocalDay.StartUtc(date, zone);

        var local = TimeZoneInfo.ConvertTime(start, zone);
        Assert.Equal(TimeSpan.Zero, start.Offset);
        Assert.Equal(date, DateOnly.FromDateTime(local.DateTime));
        Assert.Equal(new TimeOnly(1, 0), TimeOnly.FromDateTime(local.DateTime));
        Assert.True(start > RestaurantLocalDay.StartUtc(date.AddDays(-1), zone));
        Assert.True(start < RestaurantLocalDay.StartUtc(date.AddDays(1), zone));
    }

    [Fact]
    public async Task AnalyticsHandlesSkippedMidnightAndGroupsBestSellersByProduct()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = await CreateDatabaseAsync(connection);
        var zone = TimeZoneInfo.FindSystemTimeZoneById(SkippedMidnightZoneId);
        var date = FindSkippedMidnight(zone);
        var now = RestaurantLocalDay.StartUtc(date, zone).AddHours(12);
        var seeded = await SeedTenantAsync(database, "santiago", SkippedMidnightZoneId);
        var orders = await SeedProductMixAsync(database, seeded, now.AddHours(-1));

        var metrics = await new AnalyticsRepository(database).GetMetricsAsync(seeded.TenantId, 1, now,
            TestContext.Current.CancellationToken);

        Assert.NotNull(metrics);
        Assert.Equal(date.ToString("yyyy-MM-dd"), metrics.CurrentPeriod.StartDate);
        Assert.Equal(3, metrics.Orders);
        var soup = Assert.Single(metrics.BestSellers, dish => dish.Name == "Soup");
        Assert.Equal(3, soup.Quantity);
        Assert.Equal(orders.SelectMany(order => order.Lines).Where(line => line.ProductId == seeded.SoupId)
            .Sum(line => line.Total), soup.Revenue);
        Assert.DoesNotContain(metrics.BestSellers, dish => dish.Name == "Soupe");
        Assert.Equal(new[] { 1, 3 }, metrics.BestSellers.Where(dish => dish.Name == "Bread")
            .Select(dish => dish.Quantity).Order().ToArray());
    }

    [Fact]
    public async Task DashboardTopSellersGroupByProductRatherThanTranslatedName()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = await CreateDatabaseAsync(connection);
        var seeded = await SeedTenantAsync(database, "bistro", "UTC");
        var now = new DateTimeOffset(2026, 3, 10, 18, 0, 0, TimeSpan.Zero);
        await SeedProductMixAsync(database, seeded, now.AddHours(-2));

        var metrics = await CreateOrderRepository(database).GetDashboardMetricsAsync(seeded.TenantId, now, true,
            TestContext.Current.CancellationToken);

        Assert.NotNull(metrics);
        Assert.Equal(3, metrics.TopSellingItems.Count);
        var soup = Assert.Single(metrics.TopSellingItems, item => item.ProductId == seeded.SoupId);
        Assert.Equal("Soup", soup.ProductName);
        Assert.Equal(3, soup.Quantity);
        Assert.Equal(1, Assert.Single(metrics.TopSellingItems, item => item.ProductId == seeded.BreadId).Quantity);
        Assert.Equal(3, Assert.Single(metrics.TopSellingItems, item => item.ProductId == seeded.OtherBreadId).Quantity);
        Assert.Equal(2, metrics.TopSellingItems.Count(item => item.ProductName == "Bread"));
    }

    [Fact]
    public async Task KitchenListPutsEveryOpenOrderBeforeNewerClosedOrdersAcrossPages()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = await CreateDatabaseAsync(connection);
        var seeded = await SeedTenantAsync(database, "bistro", "UTC");
        var start = new DateTimeOffset(2026, 3, 10, 12, 0, 0, TimeSpan.Zero);
        var olderPending = CreateOrder(seeded, start, "Older pending");
        var ready = CreateOrder(seeded, start.AddMinutes(1), "Ready");
        ready.TransitionTo(OrderStatus.Preparing, start.AddMinutes(2));
        ready.TransitionTo(OrderStatus.Ready, start.AddMinutes(3));
        var closed = Enumerable.Range(0, 3).Select(index =>
        {
            var order = CreateOrder(seeded, start.AddMinutes(10 + index), $"Closed {index}");
            if (index == 1) order.Cancel(start.AddMinutes(20), OrderCancellationReason.CustomerRequest);
            else
            {
                order.TransitionTo(OrderStatus.Preparing, start.AddMinutes(20));
                order.TransitionTo(OrderStatus.Ready, start.AddMinutes(21));
                order.TransitionTo(OrderStatus.Completed, start.AddMinutes(22));
            }
            return order;
        }).ToArray();
        database.Orders.AddRange(new[] { olderPending, ready }.Concat(closed));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        var repository = CreateOrderRepository(database);

        var first = await repository.ListAsync(seeded.TenantId, null, null, 2, TestContext.Current.CancellationToken);
        Assert.Equal(new[] { ready.Id, olderPending.Id }, first.Items.Select(item => item.Id).ToArray());
        Assert.NotNull(first.NextCursor);
        Assert.False(first.NextCursor.IsClosed);

        var second = await repository.ListAsync(seeded.TenantId, null, first.NextCursor, 2,
            TestContext.Current.CancellationToken);
        Assert.Equal(new[] { closed[2].Id, closed[1].Id }, second.Items.Select(item => item.Id).ToArray());
        Assert.NotNull(second.NextCursor);
        Assert.True(second.NextCursor.IsClosed);

        var third = await repository.ListAsync(seeded.TenantId, null, second.NextCursor, 2,
            TestContext.Current.CancellationToken);
        Assert.Equal(closed[0].Id, Assert.Single(third.Items).Id);
        Assert.Null(third.NextCursor);

        var completedOnly = await repository.ListAsync(seeded.TenantId, OrderStatus.Completed, null, 10,
            TestContext.Current.CancellationToken);
        Assert.Equal(new[] { closed[2].Id, closed[0].Id }, completedOnly.Items.Select(item => item.Id).ToArray());
    }

    [Fact]
    public async Task ArchivalWaitsForEachRestaurantsLocalMidnight()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = await CreateDatabaseAsync(connection);
        var utc = await SeedTenantAsync(database, "london", "UTC");
        var newYork = await SeedTenantAsync(database, "newyork", "America/New_York");
        var closedAt = new DateTimeOffset(2026, 1, 1, 12, 0, 0, TimeSpan.Zero);
        var utcOrder = CreateOrder(utc, closedAt.AddHours(-1), "UTC guest");
        utcOrder.Cancel(closedAt, OrderCancellationReason.CustomerRequest);
        var newYorkOrder = CreateOrder(newYork, closedAt.AddHours(-1), "New York guest");
        newYorkOrder.Cancel(closedAt, OrderCancellationReason.CustomerRequest);
        var openOrder = CreateOrder(newYork, closedAt.AddHours(-1), "Still open");
        database.Orders.AddRange(utcOrder, newYorkOrder, openOrder);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        var repository = CreateOrderRepository(database);

        // 02:00 UTC is after UTC midnight but still 21:00 on January 1 in New York.
        Assert.Equal(1, await repository.ArchiveClosedOrdersBeforeLocalDayStartAsync(
            new DateTimeOffset(2026, 1, 2, 2, 0, 0, TimeSpan.Zero), TestContext.Current.CancellationToken));
        Assert.Equal(new DateTimeOffset(2026, 1, 2, 0, 0, 0, TimeSpan.Zero), await ArchivedAtAsync(utcOrder.Id));
        Assert.Null(await ArchivedAtAsync(newYorkOrder.Id));

        // 05:30 UTC is 00:30 on January 2 in New York (UTC-5).
        Assert.Equal(1, await repository.ArchiveClosedOrdersBeforeLocalDayStartAsync(
            new DateTimeOffset(2026, 1, 2, 5, 30, 0, TimeSpan.Zero), TestContext.Current.CancellationToken));
        Assert.Equal(new DateTimeOffset(2026, 1, 2, 5, 0, 0, TimeSpan.Zero), await ArchivedAtAsync(newYorkOrder.Id));
        Assert.Null(await ArchivedAtAsync(openOrder.Id));
        Assert.Equal(new DateTimeOffset(2026, 1, 2, 0, 0, 0, TimeSpan.Zero), await ArchivedAtAsync(utcOrder.Id));

        async Task<DateTimeOffset?> ArchivedAtAsync(Guid orderId) => await database.Orders.AsNoTracking()
            .Where(order => order.Id == orderId).Select(order => order.ArchivedAt)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    [Fact]
    public async Task HistoryDateFiltersUseRestaurantLocalDays()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = await CreateDatabaseAsync(connection);
        var seeded = await SeedTenantAsync(database, "newyork", "America/New_York");
        // 03:00 UTC on January 2 is 22:00 on January 1 in New York.
        var order = CreateOrder(seeded, new DateTimeOffset(2026, 1, 2, 3, 0, 0, TimeSpan.Zero), "Late guest");
        database.Orders.Add(order);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        var repository = CreateOrderRepository(database);

        var localDay = await repository.GetHistoryAsync(seeded.TenantId, null, null, new DateOnly(2026, 1, 1),
            new DateOnly(2026, 1, 1), "createdAt", true, 1, 25, TestContext.Current.CancellationToken);
        var nextLocalDay = await repository.GetHistoryAsync(seeded.TenantId, null, null, new DateOnly(2026, 1, 2),
            new DateOnly(2026, 1, 2), "createdAt", true, 1, 25, TestContext.Current.CancellationToken);
        var unbounded = await repository.GetHistoryAsync(seeded.TenantId, null, null, DateOnly.MinValue,
            DateOnly.MaxValue, "createdAt", true, 1, 25, TestContext.Current.CancellationToken);

        Assert.Equal(order.Id, Assert.Single(localDay.Items).Id);
        Assert.Empty(nextLocalDay.Items);
        Assert.Equal(1, unbounded.TotalCount);
    }

    private static DateOnly FindSkippedMidnight(TimeZoneInfo zone)
    {
        for (var date = new DateOnly(2026, 1, 1); date.Year < 2030; date = date.AddDays(1))
            if (zone.IsInvalidTime(date.ToDateTime(TimeOnly.MinValue))) return date;
        Assert.Fail($"{zone.Id} has no skipped local midnight in the installed time zone data.");
        return default;
    }

    private static async Task<WhitePlateDbContext> CreateDatabaseAsync(SqliteConnection connection)
    {
        var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        return database;
    }

    private static OrderRepository CreateOrderRepository(WhitePlateDbContext database) =>
        new(database, new CatalogPublicationRepository(database));

    private static async Task<SeededTenant> SeedTenantAsync(WhitePlateDbContext database, string subdomain,
        string timeZone)
    {
        var organization = Organization.Create($"{subdomain} organization");
        database.Organizations.Add(organization);
        var tenant = Tenant.Create(organization.Id, "Bistro", subdomain, "EUR");
        if (timeZone != "UTC") tenant.UpdateEstablishment(new EstablishmentInput(tenant.Name, TimeZone: timeZone));
        database.Tenants.Add(tenant);
        var category = MenuCategory.Create(tenant.Id, "Mains", 0);
        database.MenuCategories.Add(category);
        var soup = Product.Create(tenant.Id, category.Id, "Soup", null, 8.50m, 10m, 0);
        var bread = Product.Create(tenant.Id, category.Id, "Bread", null, 2m, 0m, 1);
        var otherBread = Product.Create(tenant.Id, category.Id, "Bread", null, 3m, 0m, 2);
        database.Products.AddRange(soup, bread, otherBread);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        return new SeededTenant(tenant.Id, soup.Id, bread.Id, otherBread.Id);
    }

    // Soup is ordered once under its English name and twice under its French name; two different
    // products share the name "Bread".
    private static async Task<Order[]> SeedProductMixAsync(WhitePlateDbContext database, SeededTenant seeded,
        DateTimeOffset createdAt)
    {
        var orders = new[]
        {
            Order.Create(seeded.TenantId, "EUR", "Ada", [
                new OrderLineSnapshot(seeded.SoupId, "Soup", 8.50m, 10m, 1, [])
            ], null, 0m, createdAt, menuLocale: "en"),
            Order.Create(seeded.TenantId, "EUR", "Amélie", [
                new OrderLineSnapshot(seeded.SoupId, "Soupe", 8.50m, 10m, 2, [])
            ], null, 0m, createdAt.AddMinutes(1), menuLocale: "fr"),
            Order.Create(seeded.TenantId, "EUR", "Grace", [
                new OrderLineSnapshot(seeded.BreadId, "Bread", 2m, 0m, 1, []),
                new OrderLineSnapshot(seeded.OtherBreadId, "Bread", 3m, 0m, 3, [])
            ], null, 0m, createdAt.AddMinutes(2), menuLocale: "en")
        };
        database.Orders.AddRange(orders);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        return orders;
    }

    private static Order CreateOrder(SeededTenant seeded, DateTimeOffset createdAt, string customerName) =>
        Order.Create(seeded.TenantId, "EUR", customerName, [
            new OrderLineSnapshot(seeded.SoupId, "Soup", 8.50m, 10m, 1, [])
        ], null, 0m, createdAt);

    private sealed record SeededTenant(Guid TenantId, Guid SoupId, Guid BreadId, Guid OtherBreadId);
}
