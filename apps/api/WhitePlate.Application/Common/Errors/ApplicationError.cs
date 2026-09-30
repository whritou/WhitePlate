namespace WhitePlate.Application.Common.Errors;

public sealed class ApplicationError
{
    public ErrorCode Code { get; }
    public IReadOnlyList<ValidationIssue> Issues { get; }

    public ApplicationError(ErrorCode code, params ValidationIssue[] issues)
    {
        if (!Enum.IsDefined(code))
        {
            throw new ArgumentOutOfRangeException(nameof(code));
        }

        ArgumentNullException.ThrowIfNull(issues);
        if (issues.Length > 0 && code != ErrorCode.ValidationFailed)
        {
            throw new ArgumentException("Field issues require a validation error.", nameof(issues));
        }

        Code = code;
        Issues = Array.AsReadOnly(issues.ToArray());
    }
}
