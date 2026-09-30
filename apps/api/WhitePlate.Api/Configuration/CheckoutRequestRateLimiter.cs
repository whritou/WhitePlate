using System.Threading.RateLimiting;

namespace WhitePlate.Api.Configuration;

public sealed class CheckoutRequestRateLimiter : IDisposable
{
    private readonly PartitionedRateLimiter<string> limiter;

    public CheckoutRequestRateLimiter(int permitLimit, TimeSpan window, int queueLimit)
    {
        limiter = PartitionedRateLimiter.Create<string, string>(partition =>
            RateLimitPartition.GetFixedWindowLimiter(partition, _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
                QueueLimit = queueLimit,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                AutoReplenishment = true
            }));
    }

    public ValueTask<RateLimitLease> AcquireAsync(string partition, CancellationToken cancellationToken) =>
        limiter.AcquireAsync(partition, permitCount: 1, cancellationToken);

    public void Dispose() => limiter.Dispose();
}
