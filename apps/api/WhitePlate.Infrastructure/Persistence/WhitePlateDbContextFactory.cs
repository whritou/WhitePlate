using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WhitePlate.Infrastructure.Persistence;

public sealed class WhitePlateDbContextFactory : IDesignTimeDbContextFactory<WhitePlateDbContext>
{
    public WhitePlateDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("ConnectionStrings__WhitePlate");
        if (string.IsNullOrWhiteSpace(connection))
        {
            throw new InvalidOperationException("Set ConnectionStrings__WhitePlate for EF tooling.");
        }

        return new WhitePlateDbContext(new DbContextOptionsBuilder<WhitePlateDbContext>()
            .UseNpgsql(connection).Options);
    }
}
