using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed record UpdateCategoryCommand(Guid TenantId, Guid CategoryId, string Name, int SortOrder,
    ExternalIdentity Identity);
public sealed record UpdateProductCommand(Guid TenantId, Guid ProductId, string Name, string? Description,
    decimal BasePrice, decimal TaxRatePercent, int SortOrder, bool IsAvailable, ExternalIdentity Identity,
    Guid? CategoryId = null);
public sealed record UpdateOptionGroupCommand(Guid TenantId, Guid GroupId, string Name, int MinimumSelections,
    int MaximumSelections, int SortOrder, ExternalIdentity Identity);
public sealed record UpdateOptionCommand(Guid TenantId, Guid OptionId, string Name, decimal PriceAdjustment,
    int SortOrder, ExternalIdentity Identity);
public sealed record UpdateDiscountCommand(Guid TenantId, Guid DiscountId, string Name, DiscountKind Kind,
    decimal Value, ExternalIdentity Identity);

public sealed class CatalogManagementCommandHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<MenuCategoryDto>> UpdateCategoryAsync(UpdateCategoryCommand command,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(command.TenantId, command.Identity, cancellationToken))
            return NotFound<MenuCategoryDto>();
        try
        {
            var result = await catalog.UpdateCategoryAsync(command.TenantId, command.CategoryId, command.Name,
                command.SortOrder, cancellationToken);
            return result is null ? NotFound<MenuCategoryDto>() : Result<MenuCategoryDto>.Success(result);
        }
        catch (DomainRuleException exception) { return Invalid<MenuCategoryDto>(exception); }
    }

    public async Task<Result<MenuProductDto>> UpdateProductAsync(UpdateProductCommand command,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(command.TenantId, command.Identity, cancellationToken))
            return NotFound<MenuProductDto>();
        try
        {
            var result = await catalog.UpdateProductAsync(command.TenantId, command.ProductId, command.Name,
                command.Description, command.BasePrice, command.TaxRatePercent, command.SortOrder,
                command.IsAvailable, cancellationToken, command.CategoryId);
            return result is null ? NotFound<MenuProductDto>() : Result<MenuProductDto>.Success(result);
        }
        catch (DomainRuleException exception) { return Invalid<MenuProductDto>(exception); }
    }

    public async Task<Result<MenuOptionGroupDto>> UpdateOptionGroupAsync(UpdateOptionGroupCommand command,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(command.TenantId, command.Identity, cancellationToken))
            return NotFound<MenuOptionGroupDto>();
        try
        {
            var result = await catalog.UpdateOptionGroupAsync(command.TenantId, command.GroupId, command.Name,
                command.MinimumSelections, command.MaximumSelections, command.SortOrder, cancellationToken);
            return result is null ? NotFound<MenuOptionGroupDto>() : Result<MenuOptionGroupDto>.Success(result);
        }
        catch (DomainRuleException exception) { return Invalid<MenuOptionGroupDto>(exception); }
    }

    public async Task<Result<MenuOptionDto>> UpdateOptionAsync(UpdateOptionCommand command,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(command.TenantId, command.Identity, cancellationToken))
            return NotFound<MenuOptionDto>();
        try
        {
            var result = await catalog.UpdateOptionAsync(command.TenantId, command.OptionId, command.Name,
                command.PriceAdjustment, command.SortOrder, cancellationToken);
            return result is null ? NotFound<MenuOptionDto>() : Result<MenuOptionDto>.Success(result);
        }
        catch (DomainRuleException exception) { return Invalid<MenuOptionDto>(exception); }
    }

    public async Task<Result<PromotionDiscountDto>> UpdateDiscountAsync(UpdateDiscountCommand command,
        CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(command.TenantId, command.Identity, cancellationToken))
            return NotFound<PromotionDiscountDto>();
        try
        {
            var result = await catalog.UpdateDiscountAsync(command.TenantId, command.DiscountId, command.Name,
                command.Kind, command.Value, cancellationToken);
            return result is null ? NotFound<PromotionDiscountDto>() : Result<PromotionDiscountDto>.Success(result);
        }
        catch (DomainRuleException exception) { return Invalid<PromotionDiscountDto>(exception); }
    }

    public Task<Result<bool>> SetCategoryVisibilityAsync(Guid tenantId, Guid categoryId, bool isVisible,
        ExternalIdentity identity, CancellationToken cancellationToken) => ArchiveAsync(tenantId, categoryId, identity,
        (tenant, category, token) => catalog.SetCategoryVisibilityAsync(tenant, category, isVisible, token), cancellationToken);

    public Task<Result<bool>> ArchiveCategoryAsync(Guid tenantId, Guid categoryId, ExternalIdentity identity,
        CancellationToken cancellationToken) => ArchiveAsync(tenantId, categoryId, identity,
        catalog.ArchiveCategoryAsync, cancellationToken);

    public Task<Result<bool>> ArchiveProductAsync(Guid tenantId, Guid productId, ExternalIdentity identity,
        CancellationToken cancellationToken) => ArchiveAsync(tenantId, productId, identity,
        catalog.ArchiveProductAsync, cancellationToken);

    public Task<Result<bool>> RestoreProductAsync(Guid tenantId, Guid productId, ExternalIdentity identity,
        CancellationToken cancellationToken) => ArchiveAsync(tenantId, productId, identity,
        catalog.RestoreProductAsync, cancellationToken);

    public Task<Result<bool>> ArchiveOptionGroupAsync(Guid tenantId, Guid groupId, ExternalIdentity identity,
        CancellationToken cancellationToken) => ArchiveAsync(tenantId, groupId, identity,
        catalog.ArchiveOptionGroupAsync, cancellationToken);

    public Task<Result<bool>> ArchiveOptionAsync(Guid tenantId, Guid optionId, ExternalIdentity identity,
        CancellationToken cancellationToken) => ArchiveAsync(tenantId, optionId, identity,
        catalog.ArchiveOptionAsync, cancellationToken);

    public Task<Result<bool>> DeactivateDiscountAsync(Guid tenantId, Guid discountId, ExternalIdentity identity,
        CancellationToken cancellationToken) => ArchiveAsync(tenantId, discountId, identity,
        catalog.DeactivateDiscountAsync, cancellationToken);

    private async Task<Result<bool>> ArchiveAsync(Guid tenantId, Guid id, ExternalIdentity identity,
        Func<Guid, Guid, CancellationToken, Task<bool>> operation, CancellationToken cancellationToken)
    {
        if (!await CanManageAsync(tenantId, identity, cancellationToken))
            return Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
        var archived = await operation(tenantId, id, cancellationToken);
        return archived ? Result<bool>.Success(true) : Result<bool>.Failure(new ApplicationError(ErrorCode.NotFound));
    }

    private Task<bool> CanManageAsync(Guid tenantId, ExternalIdentity identity, CancellationToken cancellationToken) =>
        CatalogAccess.CanManageAsync(memberships, tenantId, identity, cancellationToken);

    private static Result<T> NotFound<T>() => Result<T>.Failure(new ApplicationError(ErrorCode.NotFound));

    private static Result<T> Invalid<T>(DomainRuleException exception) => Result<T>.Failure(new ApplicationError(
        ErrorCode.ValidationFailed, new ValidationIssue(exception.Field, exception.Code, exception.Message)));
}
