using WhitePlate.Domain.Tenants;
using WhitePlate.Application.Tenants;
using WhitePlate.Infrastructure.Persistence;
using System.Xml.Linq;

namespace WhitePlate.Tests.Architecture;

public sealed class DependencyRulesTests
{
    [Fact]
    public void ProjectReferencesFollowTheDependencyRule()
    {
        var apiRoot = FindApiRoot();

        Assert.Empty(ProjectReferences(Path.Combine(apiRoot, "WhitePlate.Domain", "WhitePlate.Domain.csproj")));
        Assert.Equal(
            ["WhitePlate.Domain"],
            ProjectReferences(Path.Combine(apiRoot, "WhitePlate.Application", "WhitePlate.Application.csproj")));
        Assert.Equal(
            ["WhitePlate.Application"],
            ProjectReferences(Path.Combine(apiRoot, "WhitePlate.Infrastructure", "WhitePlate.Infrastructure.csproj")));
        Assert.Equal(
            ["WhitePlate.Application", "WhitePlate.Infrastructure"],
            ProjectReferences(Path.Combine(apiRoot, "WhitePlate.Api", "WhitePlate.Api.csproj")));
    }

    [Fact]
    public void DomainDoesNotReferenceOuterLayersOrFrameworks()
    {
        var references = typeof(Tenant).Assembly.GetReferencedAssemblies().Select(assembly => assembly.Name).ToArray();

        Assert.DoesNotContain(references, name => name is not null &&
            (name.StartsWith("WhitePlate.Application", StringComparison.Ordinal) ||
             name.Equals("WhitePlate.Api", StringComparison.Ordinal) ||
             name.StartsWith("WhitePlate.Infrastructure", StringComparison.Ordinal) ||
             name.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal) ||
             name.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal)));
    }

    [Fact]
    public void ApplicationDoesNotReferenceInfrastructureOrApi()
    {
        var references = typeof(CreateTenantCommandHandler).Assembly.GetReferencedAssemblies().Select(assembly => assembly.Name).ToArray();

        Assert.Contains("WhitePlate.Domain", references);
        Assert.DoesNotContain(references, name => name is not null &&
            (name.StartsWith("WhitePlate.Infrastructure", StringComparison.Ordinal) ||
             name.Equals("WhitePlate.Api", StringComparison.Ordinal) ||
             name.StartsWith("Microsoft.EntityFrameworkCore", StringComparison.Ordinal) ||
             name.StartsWith("Microsoft.AspNetCore", StringComparison.Ordinal)));
    }

    [Fact]
    public void InfrastructureDoesNotReferenceApi()
    {
        var references = typeof(WhitePlateDbContext).Assembly.GetReferencedAssemblies().Select(assembly => assembly.Name).ToArray();

        Assert.Contains("WhitePlate.Application", references);
        Assert.DoesNotContain(references, name => name?.Equals("WhitePlate.Api", StringComparison.Ordinal) is true);
    }

    private static string FindApiRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);

        while (directory is not null)
        {
            if (File.Exists(Path.Combine(directory.FullName, "WhitePlate.Domain", "WhitePlate.Domain.csproj")))
            {
                return directory.FullName;
            }

            directory = directory.Parent;
        }

        throw new DirectoryNotFoundException("Could not find the API source projects.");
    }

    private static string[] ProjectReferences(string projectPath) =>
        XDocument.Load(projectPath)
            .Descendants("ProjectReference")
            .Select(reference => Path.GetFileNameWithoutExtension((string?)reference.Attribute("Include")))
            .Order(StringComparer.Ordinal)
            .ToArray()!;
}
