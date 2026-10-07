using WhitePlate.Domain.Common;

namespace WhitePlate.Domain.Organizations;

public sealed class Organization
{
    public const int MaxNameLength = 200;

    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public bool IsActive { get; private set; }

    private Organization() { }

    public static Organization Create(string? name)
    {
        return new Organization
        {
            Id = Guid.NewGuid(),
            Name = NormalizeName(name),
            IsActive = true
        };
    }

    public void Rename(string? name) => Name = NormalizeName(name);

    public void Deactivate() => IsActive = false;

    public void Reactivate() => IsActive = true;

    private static string NormalizeName(string? name)
    {
        var normalized = name?.Trim();
        if (string.IsNullOrWhiteSpace(normalized) || normalized.Length > MaxNameLength)
        {
            throw new DomainRuleException("invalid_name", "name",
                "Organization name must contain 1 to 200 characters.");
        }

        return normalized;
    }
}
