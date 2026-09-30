using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed record CreateOptionGroupCommand(Guid TenantId, Guid ProductId, string Name, int MinimumSelections,
    int MaximumSelections, int SortOrder, ExternalIdentity Identity);
public sealed record CreateOptionCommand(Guid TenantId, Guid GroupId, string Name, decimal PriceAdjustment,
    int SortOrder, ExternalIdentity Identity);
public sealed record CreateDiscountCommand(Guid TenantId, string Code, string Name, DiscountKind Kind,
    decimal Value, ExternalIdentity Identity);

public sealed class CreateOptionGroupCommandHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<MenuOptionGroupDto>> HandleAsync(CreateOptionGroupCommand command, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, command.TenantId, command.Identity, cancellationToken) ||
            !await catalog.ProductBelongsToTenantAsync(command.TenantId, command.ProductId, cancellationToken))
            return Result<MenuOptionGroupDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var group = ProductOptionGroup.Create(command.TenantId, command.ProductId, command.Name,
                command.MinimumSelections, command.MaximumSelections, command.SortOrder);
            return Result<MenuOptionGroupDto>.Success(await catalog.AddOptionGroupAsync(group, cancellationToken));
        }
        catch (DomainRuleException exception) { return Result<MenuOptionGroupDto>.Failure(CatalogErrors.From(exception)); }
    }
}

public sealed class CreateOptionCommandHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<MenuOptionDto>> HandleAsync(CreateOptionCommand command, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, command.TenantId, command.Identity, cancellationToken) ||
            !await catalog.OptionGroupBelongsToTenantAsync(command.TenantId, command.GroupId, cancellationToken))
            return Result<MenuOptionDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var option = ProductOption.Create(command.TenantId, command.GroupId, command.Name,
                command.PriceAdjustment, command.SortOrder);
            return Result<MenuOptionDto>.Success(await catalog.AddOptionAsync(option, cancellationToken));
        }
        catch (DomainRuleException exception) { return Result<MenuOptionDto>.Failure(CatalogErrors.From(exception)); }
    }
}

public sealed class CreateDiscountCommandHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<Guid>> HandleAsync(CreateDiscountCommand command, CancellationToken cancellationToken)
    {
        if (!await CatalogAccess.CanManageAsync(memberships, command.TenantId, command.Identity, cancellationToken))
            return Result<Guid>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var discount = PromotionDiscount.Create(command.TenantId, command.Code, command.Name, command.Kind, command.Value);
            return await catalog.AddDiscountAsync(discount, cancellationToken)
                ? Result<Guid>.Success(discount.Id)
                : Result<Guid>.Failure(new ApplicationError(ErrorCode.Conflict));
        }
        catch (DomainRuleException exception) { return Result<Guid>.Failure(CatalogErrors.From(exception)); }
    }
}

internal static class CatalogErrors
{
    public static ApplicationError From(DomainRuleException exception) => new(ErrorCode.ValidationFailed,
        new ValidationIssue(exception.Field, exception.Code, exception.Message));
}
