using WhitePlate.Api.Realtime;

namespace WhitePlate.Tests.Api;

public sealed class OrderArchiveDispatcherTests
{
    [Fact]
    public void UsesTheUtcDayBoundaryForTheDailyCycle()
    {
        var now = DateTimeOffset.Parse("2026-10-07T00:15:30+02:00");

        var dayStart = OrderArchiveDispatcher.UtcDayStart(now);
        var nextRun = OrderArchiveDispatcher.NextUtcMidnight(now);

        Assert.Equal(DateTimeOffset.Parse("2026-10-06T00:00:00Z"), dayStart);
        Assert.Equal(DateTimeOffset.Parse("2026-10-07T00:00:00Z"), nextRun);
    }
}
