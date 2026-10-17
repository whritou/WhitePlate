using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Application.Payments;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Payments;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class StripeConnectRepositoryTests
{
    [Fact]
    public async Task OAuthStateCanBeConsumedOnlyOnceAndOnlyBeforeExpiry()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var tenant = await CreateTenantAsync(database);
        var repository = new StripeConnectRepository(database);
        var now = DateTimeOffset.Parse("2026-10-17T12:00:00Z");
        var validState = new StripeConnectOAuthState(new string('a', 64), tenant.Id,
            "https://identity.example.test/", "owner", StripeConnectMode.Test, "fr", now, now.AddMinutes(10));
        var expiredState = validState with { StateHash = new string('b', 64), ExpiresAt = now.AddSeconds(-1) };
        await repository.SaveOAuthStateAsync(validState, TestContext.Current.CancellationToken);
        await repository.SaveOAuthStateAsync(expiredState, TestContext.Current.CancellationToken);

        Assert.Equal(validState, await repository.ConsumeOAuthStateAsync(validState.StateHash, now,
            TestContext.Current.CancellationToken));
        Assert.Null(await repository.ConsumeOAuthStateAsync(validState.StateHash, now,
            TestContext.Current.CancellationToken));
        Assert.Null(await repository.ConsumeOAuthStateAsync(expiredState.StateHash, now,
            TestContext.Current.CancellationToken));
        Assert.Null(await repository.ConsumeOAuthStateAsync(expiredState.StateHash, now,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task WebhookEventsDeduplicateAndCannotRestoreADeauthorizedConnection()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var tenant = await CreateTenantAsync(database);
        var repository = new StripeConnectRepository(database);
        var readiness = new StripeAccountReadinessInput(true, true, true, "active", 0, 0, 0);
        var connectedAt = DateTimeOffset.Parse("2026-10-17T12:00:00Z");
        Assert.True(await repository.SaveConnectionAsync(new StripeConnectConnectionSnapshot(tenant.Id,
            StripeConnectMode.Test, "acct_test", StripeConnectionState.Connected, StripeReadinessState.Verified,
            readiness, connectedAt, connectedAt, null), connectedAt, TestContext.Current.CancellationToken));

        var newer = new StripeConnectWebhookEvent("evt_new", "account.updated", false,
            connectedAt.AddMinutes(2), "acct_test");
        Assert.True(await repository.ApplyWebhookAsync(newer, readiness, StripeReadinessState.Verified,
            connectedAt.AddMinutes(2), TestContext.Current.CancellationToken));
        Assert.True(await repository.ApplyWebhookAsync(newer, readiness, StripeReadinessState.Verified,
            connectedAt.AddMinutes(3), TestContext.Current.CancellationToken));

        var old = newer with { EventId = "evt_old", CreatedAt = connectedAt.AddMinutes(1) };
        Assert.True(await repository.ApplyWebhookAsync(old, readiness with { ChargesEnabled = false },
            StripeReadinessState.Restricted, connectedAt.AddMinutes(4), TestContext.Current.CancellationToken));

        var revoked = newer with { EventId = "evt_revoked", EventType = "account.application.deauthorized",
            CreatedAt = connectedAt.AddMinutes(5) };
        Assert.True(await repository.ApplyWebhookAsync(revoked, null, null, connectedAt.AddMinutes(5),
            TestContext.Current.CancellationToken));
        var afterRevocation = newer with { EventId = "evt_after_revocation", CreatedAt = connectedAt.AddMinutes(6) };
        Assert.True(await repository.ApplyWebhookAsync(afterRevocation, readiness, StripeReadinessState.Verified,
            connectedAt.AddMinutes(6), TestContext.Current.CancellationToken));

        var saved = await repository.GetConnectionAsync(tenant.Id, StripeConnectMode.Test,
            TestContext.Current.CancellationToken);
        Assert.NotNull(saved);
        Assert.Equal(StripeConnectionState.Disconnected, saved.ConnectionState);
        Assert.Equal(connectedAt.AddMinutes(5), saved.LastAppliedEventAt);
        Assert.Equal(StripeReadinessState.Unknown, saved.ReadinessState);
        Assert.Equal(4, await database.StripeConnectWebhookEvents.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task TestAndLiveConnectionsAreIndependentForTheSameRestaurant()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = CreateDatabase(connection);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var tenant = await CreateTenantAsync(database);
        var repository = new StripeConnectRepository(database);
        var now = DateTimeOffset.Parse("2026-10-17T12:00:00Z");
        var readiness = new StripeAccountReadinessInput(true, false, false, "inactive", 0, 0, 0);

        Assert.True(await repository.SaveConnectionAsync(new StripeConnectConnectionSnapshot(tenant.Id,
            StripeConnectMode.Test, "acct_test", StripeConnectionState.Connected, StripeReadinessState.Restricted,
            readiness, now, now, null), now, TestContext.Current.CancellationToken));
        Assert.True(await repository.SaveConnectionAsync(new StripeConnectConnectionSnapshot(tenant.Id,
            StripeConnectMode.Live, "acct_live", StripeConnectionState.Connected, StripeReadinessState.Restricted,
            readiness, now, now, null), now, TestContext.Current.CancellationToken));
    }

    private static WhitePlateDbContext CreateDatabase(SqliteConnection connection) => new(
        new DbContextOptionsBuilder<WhitePlateDbContext>().UseSqlite(connection).Options);

    private static async Task<Tenant> CreateTenantAsync(WhitePlateDbContext database)
    {
        var organization = Organization.Create("Acme");
        var tenant = Tenant.Create(organization.Id, "Bistro", "bistro", "EUR");
        database.Organizations.Add(organization);
        database.Tenants.Add(tenant);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        return tenant;
    }
}
