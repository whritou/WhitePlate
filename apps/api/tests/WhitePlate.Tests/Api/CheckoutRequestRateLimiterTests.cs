using WhitePlate.Api.Configuration;

namespace WhitePlate.Tests.Api;

public sealed class CheckoutRequestRateLimiterTests
{
    [Fact]
    public async Task LimitsRequestsWithinPartitionAndKeepsOtherPartitionsIndependent()
    {
        using var limiter = new CheckoutRequestRateLimiter(1, TimeSpan.FromMinutes(1), 0);

        using var first = await limiter.AcquireAsync("tenant-a|client", CancellationToken.None);
        using var second = await limiter.AcquireAsync("tenant-a|client", CancellationToken.None);
        using var separateTenant = await limiter.AcquireAsync("tenant-b|client", CancellationToken.None);

        Assert.True(first.IsAcquired);
        Assert.False(second.IsAcquired);
        Assert.True(separateTenant.IsAcquired);
    }
}
