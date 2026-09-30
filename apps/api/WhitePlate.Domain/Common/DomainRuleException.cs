namespace WhitePlate.Domain.Common;

public sealed class DomainRuleException(string code, string field, string message) : Exception(message)
{
    public string Code { get; } = code;
    public string Field { get; } = field;
}
