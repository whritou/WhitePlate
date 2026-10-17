namespace WhitePlate.Application.Orders;

public sealed record AnalyticsPeriod(string StartDate, string EndDate, int Days);
public sealed record AnalyticsMoneyValue(string Currency, decimal? Value, string State,
    decimal? PreviousValue, bool ComparisonAvailable, int SampleCount, int PreviousSampleCount);
public sealed record AnalyticsNumberValue(decimal? Value, string State, string Unit, int SampleCount,
    int PreviousSampleCount, decimal? PreviousValue, bool ComparisonAvailable, string Provenance);
public sealed record AnalyticsSeriesPoint(string Day, int Orders,
    IReadOnlyDictionary<string, decimal> Revenue,
    IReadOnlyDictionary<string, decimal> PreviousRevenue);
public sealed record AnalyticsHourCount(int Hour, int Orders);
public sealed record AnalyticsChannelCount(string Channel, int Orders, string State);
public sealed record AnalyticsDish(Guid TenantId, string Restaurant, string Name, int Quantity,
    decimal Revenue, string Currency);
public sealed record AnalyticsMetricsDto(int Version, Guid TenantId, string Restaurant, string Currency,
    string TimeZone, AnalyticsPeriod CurrentPeriod, AnalyticsPeriod ComparisonPeriod,
    IReadOnlyList<AnalyticsMoneyValue> Revenue,
    int Orders, int? PreviousOrders, bool OrdersComparisonAvailable,
    IReadOnlyList<AnalyticsMoneyValue> AverageOrderValue,
    AnalyticsNumberValue ReturningCustomerRate, AnalyticsNumberValue AveragePreparationMinutes,
    IReadOnlyList<AnalyticsMoneyValue> CommissionPaid,
    IReadOnlyList<AnalyticsSeriesPoint> Series,
    IReadOnlyList<AnalyticsHourCount> PeakHours,
    IReadOnlyList<AnalyticsChannelCount> Channels,
    IReadOnlyList<AnalyticsDish> BestSellers,
    AnalyticsNumberValue OnTimePickupRate, AnalyticsNumberValue AcceptedUnderOneMinuteRate,
    AnalyticsNumberValue CancellationRate, AnalyticsNumberValue FastestPreparationMinutes,
    AnalyticsNumberValue SlowestPreparationMinutes, int DiscountUses,
    AnalyticsNumberValue Refunds);

public sealed record AnalyticsMetricsQuery(Guid TenantId, int Days);

public interface IAnalyticsRepository
{
    Task<AnalyticsMetricsDto?> GetMetricsAsync(Guid tenantId, int days, DateTimeOffset now,
        CancellationToken cancellationToken);
    Task<IReadOnlyList<Guid>> GetPriorConsentedOrderIdsAsync(Guid tenantId,
        IReadOnlyList<(string KeyVersion, string Hash)> fingerprints, DateTimeOffset before,
        DateTimeOffset after, CancellationToken cancellationToken);
    Task WithdrawAsync(Guid tenantId, IReadOnlyList<(string KeyVersion, string Hash)> fingerprints,
        CancellationToken cancellationToken);
    Task<int> CleanExpiredAsync(DateTimeOffset now, CancellationToken cancellationToken);
}
