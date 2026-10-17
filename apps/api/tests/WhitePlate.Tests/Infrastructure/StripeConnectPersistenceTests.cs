using Microsoft.EntityFrameworkCore;
using WhitePlate.Infrastructure.Persistence;

namespace WhitePlate.Tests.Infrastructure;

public sealed class StripeConnectPersistenceTests
{
    [Fact]
    public void ConnectPersistenceHasSeparateModeAndReplayConstraints()
    {
        using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite("Data Source=:memory:").Options);

        var entities = database.Model.GetEntityTypes().ToDictionary(
            entity => entity.GetTableName()!, StringComparer.Ordinal);

        Assert.Contains("StripeConnectConnections", entities.Keys);
        Assert.Contains("StripeConnectOAuthStates", entities.Keys);
        Assert.Contains("StripeConnectWebhookEvents", entities.Keys);

        var connection = entities["StripeConnectConnections"];
        Assert.Contains(connection.GetIndexes(), index => index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual(["TenantId", "Mode"]));
        Assert.Contains(connection.GetIndexes(), index => index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual(["Mode", "StripeAccountId"]));

        var states = entities["StripeConnectOAuthStates"];
        Assert.Contains(states.GetIndexes(), index => index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual(["StateHash"]));

        var webhookEvents = entities["StripeConnectWebhookEvents"];
        Assert.Contains(webhookEvents.GetIndexes(), index => index.IsUnique &&
            index.Properties.Select(property => property.Name).SequenceEqual(["Mode", "EventId"]));
    }
}
