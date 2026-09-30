namespace WhitePlate.Application.Common.Errors;

// Messages must be authored by the application, never copied from input or exceptions.
public sealed record ValidationIssue(string Field, string Code, string Message);
