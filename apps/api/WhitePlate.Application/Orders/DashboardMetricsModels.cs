namespace WhitePlate.Application.Orders;

public sealed record DashboardMetricsDto(
    string Currency,
    string TimeZone,
    DateOnly BusinessDate,
    DateOnly ComparisonDate,
    int OrderCount,
    int ComparisonOrderCount,
    decimal? OrderValue,
    decimal? ComparisonOrderValue,
    ActiveOrderMetricsDto ActiveOrders,
    IReadOnlyList<HourlyOrderMetricsDto> HourlyOrders,
    IReadOnlyList<TopSellingItemMetricsDto> TopSellingItems,
    decimal? AveragePreparationMinutes,
    int PreparationSampleCount);

public sealed record ActiveOrderMetricsDto(int Total, int Pending, int Preparing, int Ready);
public sealed record HourlyOrderMetricsDto(int Hour, int Current, int Previous);
public sealed record TopSellingItemMetricsDto(Guid ProductId, string ProductName, int Quantity);

public sealed record DashboardMetricsQuery(Guid TenantId);
