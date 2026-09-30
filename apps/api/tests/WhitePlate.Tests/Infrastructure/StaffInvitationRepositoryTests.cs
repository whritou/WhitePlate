using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Infrastructure.Persistence;
using WhitePlate.Infrastructure.Persistence.Repositories;

namespace WhitePlate.Tests.Infrastructure;

public sealed class StaffInvitationRepositoryTests
{
    [Fact]
    public async Task AcceptsInvitationOnceAndCreatesTheScopedMembershipAtomically()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Acme");
        var restaurant = Tenant.Create(organization.Id, "Bistro", "bistro", "EUR");
        database.Organizations.Add(organization);
        database.Tenants.Add(restaurant);
        var tokenHash = new string('a', 64);
        var now = DateTimeOffset.Parse("2026-09-29T10:00:00Z");
        database.StaffInvitations.Add(StaffInvitation.Create(organization.Id, restaurant.Id,
            InvitationRole.KitchenStaff, "kitchen@example.test", tokenHash, now.AddDays(7), now));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        var repository = new StaffInvitationRepository(database);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "kitchen-1", "kitchen@example.test", true);

        Assert.True(await repository.AcceptAsync(tokenHash, identity, now.AddMinutes(1), TestContext.Current.CancellationToken));
        Assert.False(await repository.AcceptAsync(tokenHash, identity, now.AddMinutes(2), TestContext.Current.CancellationToken));
        Assert.True(await database.RestaurantMemberships.AnyAsync(membership => membership.TenantId == restaurant.Id &&
            membership.Issuer == identity.Issuer && membership.Subject == identity.Subject && membership.Role == RestaurantRole.Kitchen,
            TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task InvitationCannotTargetARestaurantInAnotherOrganization()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Acme");
        var otherOrganization = Organization.Create("Other");
        var restaurant = Tenant.Create(otherOrganization.Id, "Bistro", "bistro", "EUR");
        database.Organizations.AddRange(organization, otherOrganization);
        database.Tenants.Add(restaurant);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var repository = new StaffInvitationRepository(database);

        Assert.False(await repository.TenantBelongsToOrganizationAsync(organization.Id, restaurant.Id,
            TestContext.Current.CancellationToken));
    }
}
