using WhitePlate.Application.Common.Errors;

namespace WhitePlate.Application.Common.Results;

public sealed class Result<T>
{
    private readonly T? value;
    private readonly ApplicationError? error;

    private Result(T value)
    {
        ArgumentNullException.ThrowIfNull(value);
        this.value = value;
    }

    private Result(ApplicationError error)
    {
        ArgumentNullException.ThrowIfNull(error);
        this.error = error;
    }

    public bool IsSuccess => error is null;
    public T Value => IsSuccess ? value! : throw new InvalidOperationException("A failed result has no value.");
    public ApplicationError Error => error ?? throw new InvalidOperationException("A successful result has no error.");

    public static Result<T> Success(T value) => new(value);
    public static Result<T> Failure(ApplicationError error) => new(error);
}
