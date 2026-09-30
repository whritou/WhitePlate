using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using WhitePlate.Api.Tenancy;

namespace WhitePlate.Tests.Api;

public sealed class TenantHostResolverTests
{
    [Theory]
    [InlineData("BISTRO.EXAMPLE.TEST:443", "bistro")]
    [InlineData("bistro.example.test.", "bistro")]
    [InlineData("bistro.example.test.evil", null)]
    [InlineData("bistro.notexample.test", null)]
    [InlineData("example.test", null)]
    [InlineData("bistro.nested.example.test", null)]
    [InlineData("[::1]:5182", null)]
    public void MatchesOneDnsLabelUnderTheConfiguredBaseDomain(string host, string? expected)
    {
        var resolver = new TenantHostResolver(Options.Create(new TenantHostOptions { BaseDomain = "example.test" }));
        Assert.Equal(expected, resolver.Resolve(new HostString(host)));
    }
}
