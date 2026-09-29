using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Api.Errors;
using WhitePlate.Application.Identity;
using WhitePlate.Application.Staff;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/invitations")]
[Authorize]
public sealed class StaffInvitationsController(
    ICurrentIdentity currentIdentity,
    AcceptStaffInvitationCommandHandler acceptInvitation,
    ApiErrorMapper errors) : ControllerBase
{
    [HttpPost("accept")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ApiProblemResponse>(StatusCodes.Status404NotFound, "application/problem+json")]
    public async Task<IActionResult> Accept(AcceptStaffInvitationRequest request, CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        if (identity is null) return Unauthorized();
        var result = await acceptInvitation.HandleAsync(request.Token, identity, cancellationToken);
        return result.IsSuccess ? NoContent() : errors.ToActionResult(errors.Create(HttpContext, result.Error));
    }
}
