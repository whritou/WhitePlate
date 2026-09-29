namespace WhitePlate.Application.Common.Errors;

// Transport-independent categories. Wire names are explicit and stable at the API boundary.
public enum ErrorCode
{
    ValidationFailed,
    NotFound,
    Conflict,
    Unauthorized,
    Forbidden,
    PreconditionFailed,
    PreconditionRequired,
    Unexpected
}
