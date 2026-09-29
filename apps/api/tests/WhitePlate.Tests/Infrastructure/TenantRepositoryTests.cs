using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Configurations;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class TenantRepositoryTests
{
    [Fact]
    public async Task PersistsAndResolvesOnlyTheRequestedActiveTenantWithoutTracking()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Test Organization");
        database.Organizations.Add(organization);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        var repository = new TenantRepository(database);
        var first = Tenant.Create(organization.Id, "First", "first", "EUR");
        var second = Tenant.Create(organization.Id, "Second", "second", "EUR");
        var inactive = Tenant.Create(organization.Id, "Inactive", "inactive", "EUR");
        inactive.Deactivate();
        foreach (var tenant in new[] { first, second, inactive })
            Assert.True(await repository.TryAddAsync(tenant, TestContext.Current.CancellationToken));
        database.ChangeTracker.Clear();

        var found = await repository.FindActiveBySubdomainAsync(TenantSubdomain.Create("FIRST"), TestContext.Current.CancellationToken);
        Assert.Equal(first.Id, found!.Id);
        Assert.Null(await repository.FindActiveBySubdomainAsync(TenantSubdomain.Create("missing"), TestContext.Current.CancellationToken));
        Assert.Null(await repository.FindActiveBySubdomainAsync(TenantSubdomain.Create("inactive"), TestContext.Current.CancellationToken));
        Assert.Empty(database.ChangeTracker.Entries());
        Assert.False(await repository.TryAddAsync(Tenant.Create(organization.Id, "Duplicate", "First", "EUR"), TestContext.Current.CancellationToken));
        Assert.False(await repository.TryAddAsync(Tenant.Create(organization.Id, "Duplicate", "inactive", "EUR"), TestContext.Current.CancellationToken));

        // Bypass the repository's friendly check to prove the relational unique constraint exists.
        database.Tenants.Add(Tenant.Create(organization.Id, "Duplicate", "first", "EUR"));
        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync(TestContext.Current.CancellationToken));
        database.ChangeTracker.Clear();
        Assert.Equal(3, await database.Tenants.CountAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task PersistsRestaurantOwnershipAndCurrency()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Acme Restaurants");
        database.Organizations.Add(organization);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var restaurant = Tenant.Create(organization.Id, "Bistro", "bistro", "EUR");
        database.Tenants.Add(restaurant);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();

        var persisted = await database.Tenants.AsNoTracking().SingleAsync(TestContext.Current.CancellationToken);
        Assert.Equal(organization.Id, persisted.OrganizationId);
        Assert.Equal("EUR", persisted.Currency);
    }

    [Theory]
    [InlineData(TenantConfiguration.SubdomainIndex, true)]
    [InlineData("PK_Tenants", false)]
    public async Task HandlesOnlyTheExpectedPostgresUniqueViolation(string constraint, bool handled)
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).AddInterceptors(new UniqueViolationInterceptor(constraint)).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Test Organization");
        database.Organizations.Add(organization);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        database.ChangeTracker.Clear();
        var repository = new TenantRepository(database);
        var tenant = Tenant.Create(organization.Id, "First", "first", "EUR");
        if (handled)
        {
            Assert.False(await repository.TryAddAsync(tenant, TestContext.Current.CancellationToken));
            Assert.Empty(database.ChangeTracker.Entries());
        }
        else
        {
            await Assert.ThrowsAsync<DbUpdateException>(() => repository.TryAddAsync(tenant, TestContext.Current.CancellationToken));
        }
    }

    [Fact]
    public void PostgreSqlModelAndMigrationProduceExpectedSchema()
    {
        using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseNpgsql("Host=localhost;Database=unused;Username=unused").Options);
        var script = database.Database.GenerateCreateScript();
        Assert.Contains("CREATE UNIQUE INDEX \"IX_Tenants_Subdomain\"", script);
        Assert.Contains("character varying(63)", script);
        Assert.Contains("uuid NOT NULL", script);
        Assert.Contains("Organizations", script);
        Assert.Contains("Currency", script);
        Assert.Equal(6, database.Database.GetMigrations().Count());
        Assert.False(database.Database.HasPendingModelChanges());
    }

    private sealed class UniqueViolationInterceptor(string constraint) : SaveChangesInterceptor
    {
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
            InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (eventData.Context?.ChangeTracker.Entries<Tenant>().Any(entry => entry.State == EntityState.Added) == true)
            {
                throw new DbUpdateException("Private database details", new PostgresException("Private database details", "ERROR", "ERROR",
                    PostgresErrorCodes.UniqueViolation, constraintName: constraint));
            }

            return ValueTask.FromResult(result);
        }
    }
}
