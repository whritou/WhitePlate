using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class OrganizationProvisioningRepositoryTests
{
    [Fact]
    public async Task CreatesOnlyTheRequestedDefaultRolesForANewOrganization()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("New organization");
        var owner = ExternalIdentity.Create("https://id.example.test/", "owner");
        var repository = new OrganizationProvisioningRepository(database);

        await repository.CreateAsync(organization, OrganizationOwnerMembership.Create(organization.Id, owner),
            TestContext.Current.CancellationToken);

        var roles = await database.OrganizationRoleGrants.AsNoTracking()
            .Where(grant => grant.OrganizationId == organization.Id)
            .OrderBy(grant => grant.RoleId)
            .ToArrayAsync(TestContext.Current.CancellationToken);
        Assert.Equal(["Accountant", "Kitchen", "Manager"], roles.Select(role => role.RoleId).ToArray());
        Assert.Equal("Kitchen staff", roles.Single(role => role.RoleId == "Kitchen").Name);
        Assert.DoesNotContain(roles, role => role.RoleId == "Staff");
    }
}
