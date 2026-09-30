using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;
using WhitePlate.Domain.Tenants;

namespace WhitePlate.Tests.Application;

public sealed class CatalogUseCaseTests
{
    [Fact]
    public async Task RestaurantManagerCanCreateCategory()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "manager");
        var catalog = new CatalogRepositoryStub(tenantId);
        var handler = new CreateCategoryCommandHandler(new MembershipStub(tenantId, identity, RestaurantRole.Manager), catalog);

        var result = await handler.HandleAsync(new CreateCategoryCommand(tenantId, " Mains ", 0, identity),
            TestContext.Current.CancellationToken);

        Assert.True(result.IsSuccess);
        Assert.Equal("Mains", result.Value.Name);
        Assert.Equal(1, catalog.Writes);
    }

    [Fact]
    public async Task KitchenRoleCannotCreateCatalogData()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "kitchen");
        var catalog = new CatalogRepositoryStub(tenantId);
        var handler = new CreateCategoryCommandHandler(new MembershipStub(tenantId, identity, RestaurantRole.Kitchen), catalog);

        var result = await handler.HandleAsync(new CreateCategoryCommand(tenantId, "Mains", 0, identity),
            TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
        Assert.Equal(0, catalog.Writes);
    }

    [Fact]
    public async Task ProductCannotReferenceACategoryFromAnotherRestaurant()
    {
        var tenantId = Guid.NewGuid();
        var identity = ExternalIdentity.Create("https://identity.example.test/", "manager");
        var catalog = new CatalogRepositoryStub(Guid.NewGuid());
        var handler = new CreateProductCommandHandler(new MembershipStub(tenantId, identity, RestaurantRole.Manager), catalog);

        var result = await handler.HandleAsync(new CreateProductCommand(tenantId, Guid.NewGuid(), "Soup", null,
            8.50m, 10m, 0, identity), TestContext.Current.CancellationToken);

        Assert.Equal(ErrorCode.NotFound, result.Error.Code);
        Assert.Equal(0, catalog.Writes);
    }

    private sealed class CatalogRepositoryStub(Guid categoryTenantId) : ICatalogRepository
    {
        public int Writes { get; private set; }
        public Task<MenuDto> GetMenuAsync(WhitePlate.Application.Tenants.TenantDto tenant, CancellationToken cancellationToken) =>
            throw new NotImplementedException();
        public Task<CatalogManagementDto?> GetManagementCatalogAsync(Guid tenantId, CancellationToken cancellationToken) => Task.FromResult<CatalogManagementDto?>(null);
        public Task<bool> CategoryBelongsToTenantAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken) =>
            Task.FromResult(tenantId == categoryTenantId);
        public Task<MenuCategoryDto> AddCategoryAsync(WhitePlate.Domain.Catalog.MenuCategory category, CancellationToken cancellationToken)
        {
            Writes++;
            return Task.FromResult(new MenuCategoryDto(category.Id, category.Name, category.SortOrder, []));
        }
        public Task<bool> AddProductAsync(WhitePlate.Domain.Catalog.Product product, CancellationToken cancellationToken)
        {
            Writes++;
            return Task.FromResult(true);
        }
        public Task<bool> ProductBelongsToTenantAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken) =>
            Task.FromResult(tenantId == categoryTenantId);
        public Task<bool> OptionGroupBelongsToTenantAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken) =>
            Task.FromResult(tenantId == categoryTenantId);
        public Task<MenuOptionGroupDto> AddOptionGroupAsync(WhitePlate.Domain.Catalog.ProductOptionGroup group, CancellationToken cancellationToken)
        {
            Writes++;
            return Task.FromResult(new MenuOptionGroupDto(group.Id, group.Name, group.MinimumSelections,
                group.MaximumSelections, group.SortOrder, []));
        }
        public Task<MenuOptionDto> AddOptionAsync(WhitePlate.Domain.Catalog.ProductOption option, CancellationToken cancellationToken)
        {
            Writes++;
            return Task.FromResult(new MenuOptionDto(option.Id, option.Name, option.PriceAdjustment, option.SortOrder));
        }
        public Task<bool> AddDiscountAsync(WhitePlate.Domain.Catalog.PromotionDiscount discount, CancellationToken cancellationToken)
        {
            Writes++;
            return Task.FromResult(true);
        }
        public Task<MenuCategoryDto?> UpdateCategoryAsync(Guid tenantId, Guid categoryId, string name, int sortOrder, CancellationToken cancellationToken) => Task.FromResult<MenuCategoryDto?>(null);
        public Task<MenuProductDto?> UpdateProductAsync(Guid tenantId, Guid productId, string name, string? description, decimal basePrice, decimal taxRatePercent, int sortOrder, bool isAvailable, CancellationToken cancellationToken) => Task.FromResult<MenuProductDto?>(null);
        public Task<MenuOptionGroupDto?> UpdateOptionGroupAsync(Guid tenantId, Guid groupId, string name, int minimumSelections, int maximumSelections, int sortOrder, CancellationToken cancellationToken) => Task.FromResult<MenuOptionGroupDto?>(null);
        public Task<MenuOptionDto?> UpdateOptionAsync(Guid tenantId, Guid optionId, string name, decimal priceAdjustment, int sortOrder, CancellationToken cancellationToken) => Task.FromResult<MenuOptionDto?>(null);
        public Task<PromotionDiscountDto?> UpdateDiscountAsync(Guid tenantId, Guid discountId, string name, WhitePlate.Domain.Catalog.DiscountKind kind, decimal value, CancellationToken cancellationToken) => Task.FromResult<PromotionDiscountDto?>(null);
        public Task<bool> ArchiveCategoryAsync(Guid tenantId, Guid categoryId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> ArchiveProductAsync(Guid tenantId, Guid productId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> ArchiveOptionGroupAsync(Guid tenantId, Guid groupId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> ArchiveOptionAsync(Guid tenantId, Guid optionId, CancellationToken cancellationToken) => Task.FromResult(false);
        public Task<bool> DeactivateDiscountAsync(Guid tenantId, Guid discountId, CancellationToken cancellationToken) => Task.FromResult(false);
    }

    private sealed class MembershipStub(Guid tenantId, ExternalIdentity identity, RestaurantRole role) : IStaffMembershipRepository
    {
        public Task<bool> IsOrganizationOwnerAsync(Guid organizationId, ExternalIdentity candidate, CancellationToken cancellationToken) =>
            Task.FromResult(false);
        public Task<bool> IsOrganizationOwnerOfTenantAsync(Guid candidateTenantId, ExternalIdentity candidate, CancellationToken cancellationToken) =>
            Task.FromResult(false);
        public Task<bool> HasRestaurantRoleAsync(Guid candidateTenantId, ExternalIdentity candidate, RestaurantRole requestedRole,
            CancellationToken cancellationToken) => Task.FromResult(candidateTenantId == tenantId && candidate == identity && requestedRole == role);
    }
}
