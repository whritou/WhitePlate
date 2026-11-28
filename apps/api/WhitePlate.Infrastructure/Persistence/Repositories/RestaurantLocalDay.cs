namespace WhitePlate.Infrastructure.Persistence.Repositories;

/// <summary>Restaurant-local calendar day boundaries shared by dashboard, analytics, history and archival queries.</summary>
public static class RestaurantLocalDay
{
    /// <summary>
    /// Returns the UTC instant at which <paramref name="date"/> starts in <paramref name="zone"/>.
    /// Local midnight does not exist in zones whose daylight-saving change happens at 00:00 (for example
    /// America/Santiago in September), so the first valid local minute of the day is used instead.
    /// When the start is ambiguous, the earlier instant (largest offset) is used.
    /// </summary>
    public static DateTimeOffset StartUtc(DateOnly date, TimeZoneInfo zone)
    {
        var localStart = DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Unspecified);
        for (var minute = 0; zone.IsInvalidTime(localStart); minute++)
        {
            if (minute >= 24 * 60) throw new InvalidTimeZoneException("The time zone has no valid start for this local date.");
            localStart = localStart.AddMinutes(1);
        }

        var offset = zone.IsAmbiguousTime(localStart)
            ? zone.GetAmbiguousTimeOffsets(localStart).Max()
            : zone.GetUtcOffset(localStart);
        return new DateTimeOffset(localStart, offset).ToUniversalTime();
    }

    /// <summary>Returns the restaurant-local calendar date that contains <paramref name="instant"/>.</summary>
    public static DateOnly DateOf(DateTimeOffset instant, TimeZoneInfo zone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(instant, zone).DateTime);

    /// <summary>Resolves a saved tenant time zone, falling back to UTC for an unknown identifier.</summary>
    public static TimeZoneInfo ResolveZone(string? timeZoneId) =>
        !string.IsNullOrWhiteSpace(timeZoneId) && TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId, out var zone)
            ? zone
            : TimeZoneInfo.Utc;
}
