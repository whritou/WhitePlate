using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc;

namespace WhitePlate.Api.Contracts;

public sealed class ApiProblemResponse : ProblemDetails
{
    public required string Code { get; init; }
    public required string TraceId { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<ValidationIssueResponse>? Errors { get; init; }
}

public sealed record ValidationIssueResponse(string Field, string Code, string Message);
