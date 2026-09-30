namespace WhitePlate.Api.Contracts;

public sealed record CreateOptionGroupRequest(string Name, int MinimumSelections, int MaximumSelections, int SortOrder);
