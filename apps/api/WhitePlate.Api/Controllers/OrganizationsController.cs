using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Organizations;
using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Staff;
using WhitePlate.Application.Tenants;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/organizations")]
[Authorize]
public sealed class OrganizationsController(
    ICurrentIdentity currentIdentity,
    CreateRestaurantCommandHandler createRestaurant,
    CreateOrganizationCommandHandler createOrganization,
    CreateStaffInvitationCommandHandler createInvitation,
    RevokeStaffInvitationCommandHandler revokeInvitation,
    IOrganizationRepository organizations,
    RenameOrganizationCommandHandler renameOrganization,
    ApiErrorMapper errors,
    TimeProvider timeProvider) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType<OrganizationDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status403Forbidden, "application/problem+json")]
    public async Task<ActionResult<OrganizationDto>> Create(CreateOrganizationRequest request,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await createOrganization.HandleAsync(request.Name, identity, cancellationToken);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        return StatusCode(StatusCodes.Status201Created, result.Value);
    }

    [HttpGet]
    [ProducesResponseType<OrganizationDto[]>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<OrganizationDto>>> List(CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        return Ok(await organizations.ListOwnedAsync(identity, cancellationToken));
    }

    [HttpGet("{organizationId:guid}/restaurants")]
    [ProducesResponseType<TenantResponse[]>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<TenantResponse>>> ListRestaurants(Guid organizationId,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var restaurants = await organizations.ListRestaurantsOwnedAsync(organizationId, identity, cancellationToken);
        return restaurants is null
            ? errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.NotFound)))
            : Ok(restaurants.Select(item => new TenantResponse(item.Id, item.Name, item.Subdomain, item.Currency,
                item.DefaultMenuLocale, item.MenuLocales)).ToArray());
    }

    [HttpGet("{organizationId:guid}/members")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<OrganizationMemberDto[]>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<IReadOnlyList<OrganizationMemberDto>>> ListMembers(Guid organizationId,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var members = await organizations.ListMembersOwnedAsync(organizationId, identity, cancellationToken);
        return members is null
            ? errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.NotFound)))
            : Ok(members);
    }

    [HttpGet("{organizationId:guid}/invitations")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<OrganizationInvitationSummaryDto[]>(StatusCodes.Status200OK)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<ActionResult<IReadOnlyList<OrganizationInvitationSummaryDto>>> ListInvitations(Guid organizationId,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var invitations = await organizations.ListInvitationsOwnedAsync(organizationId, identity,
            timeProvider.GetUtcNow(), cancellationToken);
        return invitations is null
            ? errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.NotFound)))
            : Ok(invitations);
    }

    [HttpPatch("{organizationId:guid}")]
    [ProducesResponseType<OrganizationDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<OrganizationDto>> Rename(Guid organizationId, RenameOrganizationRequest request,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await renameOrganization.HandleAsync(organizationId, request.Name, identity, cancellationToken);
        return result.IsSuccess ? Ok(result.Value) : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    [HttpPost("{organizationId:guid}/restaurants")]
    [ProducesResponseType<TenantResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status401Unauthorized, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status409Conflict, "application/problem+json")]
    public async Task<ActionResult<TenantResponse>> CreateRestaurant(Guid organizationId,
        CreateRestaurantRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await createRestaurant.HandleAsync(new CreateRestaurantCommand(organizationId,
            request.Name, request.Subdomain, request.Currency, identity), cancellationToken);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        var tenant = result.Value;
        return StatusCode(StatusCodes.Status201Created,
            new TenantResponse(tenant.Id, tenant.Name, tenant.Subdomain, tenant.Currency,
                tenant.DefaultMenuLocale, tenant.MenuLocales));
    }

    [HttpPost("{organizationId:guid}/invitations")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType<StaffInvitationResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<StaffInvitationResponse>> CreateInvitation(Guid organizationId,
        CreateStaffInvitationRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        if (!TryParseRole(request.Role, out var role))
            return errors.ToActionResult(errors.Create(HttpContext, new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("role", "invalid_role", "Invitation role is not supported."))));
        var result = await createInvitation.HandleAsync(new CreateStaffInvitationCommand(organizationId,
            request.TenantId, request.Email, role, identity), cancellationToken);
        if (!result.IsSuccess) return errors.ToActionResult(errors.Create(HttpContext, result.Error));
        var invitation = result.Value;
        return StatusCode(StatusCodes.Status201Created,
            new StaffInvitationResponse(invitation.Id, invitation.Token, invitation.ExpiresAt));
    }

    [HttpDelete("{organizationId:guid}/invitations/{invitationId:guid}")]
    public async Task<IActionResult> RevokeInvitation(Guid organizationId, Guid invitationId,
        CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await revokeInvitation.HandleAsync(organizationId, invitationId, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }

    private static bool TryParseRole(string value, out InvitationRole role)
    {
        role = value switch
        {
            "OrganizationOwner" => InvitationRole.OrganizationOwner,
            "RestaurantManager" => InvitationRole.RestaurantManager,
            "KitchenStaff" => InvitationRole.KitchenStaff,
            _ => 0
        };
        return Enum.IsDefined(role);
    }
}
