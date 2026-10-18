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
    public async Task AcceptsCustomRoleInvitationAndPreservesItsExactPermissionGrants()
    {
        await using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var database = new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseSqlite(connection).Options);
        await database.Database.EnsureCreatedAsync(TestContext.Current.CancellationToken);
        var organization = Organization.Create("Acme");
        var restaurant = Tenant.Create(organization.Id, "Bistro", "custom-invite-bistro", "EUR");
        var role = OrganizationRoleGrantSet.CreateCustom(organization.Id, "Kitchen support",
            [RestaurantPermissionCatalog.KitchenDisplay]);
        var tokenHash = new string('b', 64);
        var now = DateTimeOffset.Parse("2026-09-29T10:00:00Z");
        database.Organizations.Add(organization);
        database.Tenants.Add(restaurant);
        database.OrganizationRoleGrants.Add(role);
        database.StaffInvitations.Add(StaffInvitation.Create(organization.Id, restaurant.Id,
            InvitationRole.RestaurantStaff, role.RoleId, "custom@example.test", tokenHash, now.AddDays(7), now));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        var identity = ExternalIdentity.Create("https://identity.example.test/", "custom-user",
            "custom@example.test", true);
        var invitations = new StaffInvitationRepository(database);

        Assert.True(await invitations.AcceptAsync(tokenHash, identity, now.AddMinutes(1),
            TestContext.Current.CancellationToken));

        var membership = await database.RestaurantMemberships.SingleAsync(item => item.TenantId == restaurant.Id &&
            item.Subject == identity.Subject, TestContext.Current.CancellationToken);
        Assert.Equal(role.RoleId, membership.RoleId);
        var permissions = new StaffMembershipRepository(database);
        Assert.True(await permissions.HasPermissionAsync(restaurant.Id, identity, RestaurantPermission.KitchenDisplay,
            TestContext.Current.CancellationToken));
        Assert.False(await permissions.HasPermissionAsync(restaurant.Id, identity, RestaurantPermission.OrdersManage,
            TestContext.Current.CancellationToken));
    }

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
        database.OrganizationRoleGrants.Add(
            OrganizationRoleGrantSet.CreateDefault(organization.Id, RestaurantRole.Kitchen));
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
