using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Organizations;
using WhitePlate.Domain.Organizations;

namespace WhitePlate.Tests.Application;

public sealed class ProvisionOrganizationTests
{
    [Fact]
    public async Task CreatesOrganizationAndInitialOidcOwnerAsOneCommand()
    {
        var repository = new OrganizationProvisioningStub();
        var handler = new ProvisionOrganizationCommandHandler(repository);

        var result = await handler.HandleAsync(new ProvisionOrganizationCommand(" Acme ",
            "https://identity.example.test/", "owner-1"), TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("Acme", result.Value.Name);
        Assert.Equal("https://identity.example.test/", repository.Owner!.Issuer);
        Assert.Equal("owner-1", repository.Owner.Subject);
        Assert.Equal(result.Value.Id, repository.Owner.OrganizationId);
        Assert.Equal(1, repository.Writes);
    }

    [Fact]
    public async Task InvalidOidcIdentityDoesNotCreateAnOrganization()
    {
        var repository = new OrganizationProvisioningStub();
        var handler = new ProvisionOrganizationCommandHandler(repository);

        var result = await handler.HandleAsync(new ProvisionOrganizationCommand("Acme", "bad issuer", "owner-1"),
            TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.ValidationFailed, result.Error.Code);
        Assert.Equal("invalid_issuer", Assert.Single(result.Error.Issues).Code);
        Assert.Equal(0, repository.Writes);
    }

    private sealed class OrganizationProvisioningStub : IOrganizationProvisioningRepository
    {
        public OrganizationOwnerMembership? Owner { get; private set; }
        public int Writes { get; private set; }

        public Task CreateAsync(Organization organization, OrganizationOwnerMembership owner,
            CancellationToken cancellationToken)
        {
            Writes++;
            Owner = owner;
            return Task.CompletedTask;
        }
    }
}
