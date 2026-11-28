using WhitePlate.Api.Realtime;

namespace WhitePlate.Tests.Api;

public sealed class OrderArchiveDispatcherTests
{
    [Theory]
    [InlineData("2026-10-07T00:15:30+02:00", "2026-10-06T22:30:00Z")]
    [InlineData("2026-10-06T22:30:00Z", "2026-10-06T22:45:00Z")]
    [InlineData("2026-10-06T23:59:59Z", "2026-10-07T00:00:00Z")]
    public void RunsOnTheNextUtcQuarterHourSoEveryRestaurantMidnightIsReached(string now, string expected)
    {
        var nextRun = OrderArchiveDispatcher.NextRun(DateTimeOffset.Parse(now));

        Assert.Equal(DateTimeOffset.Parse(expected), nextRun);
        Assert.Equal(TimeSpan.Zero, nextRun.Offset);
    }
}
