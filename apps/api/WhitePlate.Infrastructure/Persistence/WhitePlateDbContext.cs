using Microsoft.EntityFrameworkCore;
using WhitePlate.Domain.Organizations;
using WhitePlate.Domain.Tenants;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Orders;

namespace WhitePlate.Infrastructure.Persistence;

public sealed class WhitePlateDbContext(DbContextOptions<WhitePlateDbContext> options) : DbContext(options)
{
    public DbSet<WhitePlate.Domain.Media.MediaAsset> MediaAssets => Set<WhitePlate.Domain.Media.MediaAsset>();
    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<OrganizationOwnerMembership> OrganizationOwnerMemberships => Set<OrganizationOwnerMembership>();
    public DbSet<RestaurantMembership> RestaurantMemberships => Set<RestaurantMembership>();
    public DbSet<StaffInvitation> StaffInvitations => Set<StaffInvitation>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductOptionGroup> ProductOptionGroups => Set<ProductOptionGroup>();
    public DbSet<ProductOption> ProductOptions => Set<ProductOption>();
    public DbSet<PromotionDiscount> PromotionDiscounts => Set<PromotionDiscount>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<IdempotencyRecord> OrderIdempotencyRecords => Set<IdempotencyRecord>();
    public DbSet<OutboxMessage> OrderOutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WhitePlateDbContext).Assembly);
}
