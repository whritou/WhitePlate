using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Catalog;
using WhitePlate.Domain.Common;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Catalog;

public sealed record CreateProductCommand(Guid TenantId, Guid CategoryId, string Name, string? Description,
    decimal BasePrice, decimal TaxRatePercent, int SortOrder, ExternalIdentity Identity,
    string? Sku = null, IReadOnlyList<string>? ContainsAllergens = null,
    IReadOnlyList<string>? MayContainAllergens = null, IReadOnlyList<string>? DietaryTags = null,
    int? PreparationMinutes = null, IReadOnlyDictionary<string, string>? PreparationNotes = null);

public sealed class CreateProductCommandHandler(IStaffMembershipRepository memberships, ICatalogRepository catalog)
{
    public async Task<Result<MenuProductDto>> HandleAsync(CreateProductCommand command, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();
        if (!await CatalogAccess.CanManageAsync(memberships, command.TenantId, command.Identity, cancellationToken) ||
            !await catalog.CategoryBelongsToTenantAsync(command.TenantId, command.CategoryId, cancellationToken))
            return Result<MenuProductDto>.Failure(new ApplicationError(ErrorCode.NotFound));
        try
        {
            var product = Product.Create(command.TenantId, command.CategoryId, command.Name, command.Description,
                command.BasePrice, command.TaxRatePercent, command.SortOrder);
            product.SetMetadata(command.Sku, command.ContainsAllergens, command.MayContainAllergens,
                command.DietaryTags, command.PreparationMinutes, command.PreparationNotes);
            if (!await catalog.AddProductAsync(product, cancellationToken))
                return Result<MenuProductDto>.Failure(new ApplicationError(ErrorCode.Conflict));
            return Result<MenuProductDto>.Success(new MenuProductDto(product.Id, product.Name, product.Description,
                product.BasePrice, product.TaxRatePercent, product.SortOrder, [])
            {
                ContainsAllergens = product.ContainsAllergens,
                MayContainAllergens = product.MayContainAllergens,
                DietaryTags = product.DietaryTags,
                PreparationMinutes = product.PreparationMinutes,
                PreparationNotes = product.PreparationNotes
            });
        }
        catch (DomainRuleException exception)
        {
            return Result<MenuProductDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
    }
}
