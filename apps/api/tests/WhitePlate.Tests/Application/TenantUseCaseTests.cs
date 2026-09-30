using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class TenantUseCaseTests
{
    [Theory]
    [InlineData("", "bistro", "invalid_name")]
    [InlineData("Bistro", "bad.name", "invalid_subdomain")]
    [InlineData("Bistro", "API", "reserved_subdomain")]
    public async Task InvalidCreationDoesNotCallPersistence(string name, string subdomain, string code)
    {
        var repository = new StubRepository();
        var result = await new CreateTenantCommandHandler(repository).HandleAsync(
            new CreateTenantCommand(Guid.NewGuid(), name, subdomain, "EUR"), TestContext.Current.CancellationToken);
        Assert.Equal(ErrorCode.ValidationFailed, result.Error.Code);
        Assert.Equal(code, Assert.Single(result.Error.Issues).Code);
        Assert.Equal(0, repository.Writes);
    }

    [Fact]
    public async Task CreatesNormalizedTenantAndMapsConflict()
    {
        var repository = new StubRepository();
        var handler = new CreateTenantCommandHandler(repository);
        var command = new CreateTenantCommand(Guid.NewGuid(), " Bistro ", " BISTRO ", "EUR");
        var created = await handler.HandleAsync(command, TestContext.Current.CancellationToken);
        Assert.Equal("bistro", created.Value.Subdomain);
        Assert.Equal("Bistro", created.Value.Name);
        var duplicate = await handler.HandleAsync(command, TestContext.Current.CancellationToken);
        Assert.Equal(ErrorCode.Conflict, duplicate.Error.Code);
    }

    [Fact]
    public async Task ResolutionDoesNotRevealMissingOrInactiveTenants()
    {
        var repository = new StubRepository();
        var handler = new ResolveTenantQueryHandler(repository);
        var missing = await handler.HandleAsync(new ResolveTenantQuery("missing"), TestContext.Current.CancellationToken);
        Assert.Equal(ErrorCode.NotFound, missing.Error.Code);
        repository.Tenant = Tenant.Create(Guid.NewGuid(), "Bistro", "bistro", "EUR");
        repository.Tenant.Deactivate();
        var inactive = await handler.HandleAsync(new ResolveTenantQuery("bistro"), TestContext.Current.CancellationToken);
        Assert.Equal(ErrorCode.NotFound, inactive.Error.Code);
    }

    [Fact]
    public async Task CancellationStopsBeforePersistence()
    {
        var repository = new StubRepository();
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => new CreateTenantCommandHandler(repository)
            .HandleAsync(new CreateTenantCommand(Guid.NewGuid(), "Bistro", "bistro", "EUR"), cancellation.Token));
        Assert.Equal(0, repository.Writes);
    }

    private sealed class StubRepository : ITenantRepository
    {
        public Tenant? Tenant { get; set; }
        public int Writes { get; private set; }

        public Task<Tenant?> FindActiveBySubdomainAsync(TenantSubdomain subdomain, CancellationToken cancellationToken) =>
            Task.FromResult(Tenant is { IsActive: true } && Tenant.Subdomain == subdomain ? Tenant : null);

        public Task<bool> TryAddAsync(Tenant tenant, CancellationToken cancellationToken)
        {
            Writes++;
            if (Tenant is not null) return Task.FromResult(false);
            Tenant = tenant;
            return Task.FromResult(true);
        }
    }
}
