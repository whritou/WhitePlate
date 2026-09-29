using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WhitePlate.Api.Contracts;
using WhitePlate.Application.Identity;

namespace WhitePlate.Api.Controllers;

[ApiController]
[Route("api/v1/me")]
[Authorize]
public sealed class CurrentUserController(ICurrentIdentity currentIdentity, GetCurrentUserQueryHandler getCurrentUser) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CurrentUserDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CurrentUserDto>> Get(CancellationToken cancellationToken)
    {
        var identity = currentIdentity.Identity;
        return identity is null
            ? Unauthorized()
            : Ok(await getCurrentUser.HandleAsync(identity, cancellationToken));
    }
}
