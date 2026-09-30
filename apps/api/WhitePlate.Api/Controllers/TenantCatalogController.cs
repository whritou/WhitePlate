using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Catalog;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Identity;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/tenants/{tenantId:guid}")]
public sealed class TenantCatalogController(
    ICurrentIdentity currentIdentity,
    CreateCategoryCommandHandler createCategory,
    CreateProductCommandHandler createProduct,
    CreateOptionGroupCommandHandler createOptionGroup,
    CreateOptionCommandHandler createOption,
    CreateDiscountCommandHandler createDiscount,
    CatalogManagementCommandHandler manageCatalog,
    GetManagementCatalogQueryHandler getManagementCatalog,
    MenuLanguageSettingsHandler menuLanguageSettings,
    ApiErrorMapper errors) : ControllerBase
{
    [HttpGet("menu-languages")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<MenuLanguageSettingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuLanguageSettingsDto>> GetMenuLanguages(Guid tenantId,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await menuLanguageSettings.GetAsync(tenantId, identity, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("menu-languages")]
    [ProducesResponseType<MenuLanguageSettingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuLanguageSettingsDto>> UpdateMenuLanguages(Guid tenantId,
        UpdateMenuLanguagesRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await menuLanguageSettings.UpdateAsync(tenantId, identity, request.Locales,
            request.DefaultLocale, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("catalog/{entityType}/{entityId:guid}/translation")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> UpdateTranslation(Guid tenantId, string entityType, Guid entityId,
        UpdateCatalogTranslationRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await menuLanguageSettings.TranslateAsync(tenantId, entityId, entityType, identity,
            request.Locale, request.Name, request.Description, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpGet("catalog")]
    [ProducesResponseType<CatalogManagementDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<ActionResult<CatalogManagementDto>> GetCatalog(Guid tenantId, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await getManagementCatalog.HandleAsync(new GetManagementCatalogQuery(tenantId, identity), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("categories")]
    [ProducesResponseType<MenuCategoryDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<ActionResult<MenuCategoryDto>> CreateCategory(Guid tenantId,
        CreateMenuCategoryRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await createCategory.HandleAsync(new CreateCategoryCommand(tenantId, request.Name,
            request.SortOrder, identity), cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) :
            errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("categories/{categoryId:guid}")]
    [ProducesResponseType<MenuCategoryDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuCategoryDto>> UpdateCategory(Guid tenantId, Guid categoryId,
        UpdateMenuCategoryRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.UpdateCategoryAsync(new UpdateCategoryCommand(tenantId, categoryId,
            request.Name, request.SortOrder, identity), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpDelete("categories/{categoryId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> ArchiveCategory(Guid tenantId, Guid categoryId, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.ArchiveCategoryAsync(tenantId, categoryId, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("products")]
    [ProducesResponseType<MenuProductDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    public async Task<ActionResult<MenuProductDto>> CreateProduct(Guid tenantId,
        CreateMenuProductRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await createProduct.HandleAsync(new CreateProductCommand(tenantId, request.CategoryId,
            request.Name, request.Description, request.BasePrice, request.TaxRatePercent, request.SortOrder, identity),
            cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) :
            errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("products/{productId:guid}")]
    [ProducesResponseType<MenuProductDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuProductDto>> UpdateProduct(Guid tenantId, Guid productId,
        UpdateMenuProductRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.UpdateProductAsync(new UpdateProductCommand(tenantId, productId,
            request.Name, request.Description, request.BasePrice, request.TaxRatePercent, request.SortOrder,
            request.IsAvailable, identity), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpDelete("products/{productId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> ArchiveProduct(Guid tenantId, Guid productId, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.ArchiveProductAsync(tenantId, productId, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("products/{productId:guid}/option-groups")]
    [ProducesResponseType<MenuOptionGroupDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuOptionGroupDto>> CreateOptionGroup(Guid tenantId, Guid productId,
        CreateOptionGroupRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await createOptionGroup.HandleAsync(new CreateOptionGroupCommand(tenantId, productId,
            request.Name, request.MinimumSelections, request.MaximumSelections, request.SortOrder, identity), cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) :
            errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("option-groups/{groupId:guid}")]
    [ProducesResponseType<MenuOptionGroupDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuOptionGroupDto>> UpdateOptionGroup(Guid tenantId, Guid groupId,
        UpdateOptionGroupRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.UpdateOptionGroupAsync(new UpdateOptionGroupCommand(tenantId, groupId,
            request.Name, request.MinimumSelections, request.MaximumSelections, request.SortOrder, identity), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpDelete("option-groups/{groupId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> ArchiveOptionGroup(Guid tenantId, Guid groupId, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.ArchiveOptionGroupAsync(tenantId, groupId, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("option-groups/{groupId:guid}/options")]
    [ProducesResponseType<MenuOptionDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuOptionDto>> CreateOption(Guid tenantId, Guid groupId,
        CreateOptionRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await createOption.HandleAsync(new CreateOptionCommand(tenantId, groupId,
            request.Name, request.PriceAdjustment, request.SortOrder, identity), cancellationToken);
        return result.IsSuccess ? StatusCode(StatusCodes.Status201Created, result.Value) :
            errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("options/{optionId:guid}")]
    [ProducesResponseType<MenuOptionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<MenuOptionDto>> UpdateOption(Guid tenantId, Guid optionId,
        UpdateOptionRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.UpdateOptionAsync(new UpdateOptionCommand(tenantId, optionId,
            request.Name, request.PriceAdjustment, request.SortOrder, identity), cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpDelete("options/{optionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> ArchiveOption(Guid tenantId, Guid optionId, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.ArchiveOptionAsync(tenantId, optionId, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("discounts")]
    [ProducesResponseType<DiscountResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<ActionResult<DiscountResponse>> CreateDiscount(Guid tenantId,
        CreateDiscountRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var kind = request.Kind switch
        {
            "FixedAmount" => WhitePlate.Domain.Catalog.DiscountKind.FixedAmount,
            "Percentage" => WhitePlate.Domain.Catalog.DiscountKind.Percentage,
            _ => (WhitePlate.Domain.Catalog.DiscountKind)0
        };
        var result = await createDiscount.HandleAsync(new CreateDiscountCommand(tenantId, request.Code,
            request.Name, kind, request.Value, identity), cancellationToken);
        return result.IsSuccess
            ? StatusCode(StatusCodes.Status201Created, new DiscountResponse(result.Value,
                request.Code.Trim().ToUpperInvariant(), request.Name.Trim(), request.Kind, request.Value))
            : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPut("discounts/{discountId:guid}")]
    [ProducesResponseType<DiscountResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status400BadRequest, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<DiscountResponse>> UpdateDiscount(Guid tenantId, Guid discountId,
        UpdateDiscountRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var kind = ParseDiscountKind(request.Kind);
        var result = await manageCatalog.UpdateDiscountAsync(new UpdateDiscountCommand(tenantId, discountId,
            request.Name, kind, request.Value, identity), cancellationToken);
        return result.IsSuccess ? Ok(new DiscountResponse(result.Value.Id, result.Value.Code, result.Value.Name,
            result.Value.Kind, result.Value.Value)) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpDelete("discounts/{discountId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> DeactivateDiscount(Guid tenantId, Guid discountId, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await manageCatalog.DeactivateDiscountAsync(tenantId, discountId, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    private static WhitePlate.Domain.Catalog.DiscountKind ParseDiscountKind(string kind) => kind switch
    {
        "FixedAmount" => WhitePlate.Domain.Catalog.DiscountKind.FixedAmount,
        "Percentage" => WhitePlate.Domain.Catalog.DiscountKind.Percentage,
        _ => (WhitePlate.Domain.Catalog.DiscountKind)0
    };
}
