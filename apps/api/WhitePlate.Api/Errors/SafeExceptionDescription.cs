using System.Text.RegularExpressions;

namespace WhitePlate.Api.Errors;

/// <summary>
/// Builds a bounded, redacted diagnostic for background-worker and health-check failures.
/// Raw exceptions are never logged because provider messages, data and stack traces may contain secrets,
/// but a type name alone hid actionable infrastructure faults (for example a PostgreSQL CA file that the
/// container could not read). This keeps the root-cause type and message while redacting connection-string
/// style secrets and URL credentials, removing line breaks and limiting length.
/// </summary>
public static partial class SafeExceptionDescription
{
    private const int MaxMessageLength = 300;

    public static string Describe(Exception exception)
    {
        ArgumentNullException.ThrowIfNull(exception);
        var root = exception;
        while (root.InnerException is not null) root = root.InnerException;
        if (root is AggregateException { InnerExceptions.Count: > 0 } aggregate)
        {
            root = aggregate.InnerExceptions[0];
            while (root.InnerException is not null) root = root.InnerException;
        }

        return $"{root.GetType().Name}: {Sanitize(root.Message)}";
    }

    public static string Sanitize(string? message)
    {
        if (string.IsNullOrWhiteSpace(message)) return "(no message)";
        var sanitized = SecretAssignment().Replace(message, match => $"{match.Groups["key"].Value}=[redacted]");
        sanitized = UrlCredentials().Replace(sanitized, "://[redacted]@");
        sanitized = Whitespace().Replace(sanitized, " ").Trim();
        return sanitized.Length <= MaxMessageLength ? sanitized : sanitized[..MaxMessageLength] + "...";
    }

    [GeneratedRegex(@"\b(?<key>password|pwd|passwd|user\s*id|uid|username|user|secret|token|api[_\s-]?key|access[_\s-]?key|authorization)\s*[=:]\s*(?:""[^""]*""|'[^']*'|[^;,\s]+)",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex SecretAssignment();

    [GeneratedRegex(@"://[^/\s:@]+:[^/\s@]+@", RegexOptions.CultureInvariant)]
    private static partial Regex UrlCredentials();

    [GeneratedRegex(@"\s+", RegexOptions.CultureInvariant)]
    private static partial Regex Whitespace();
}
