using WhitePlate.Application.Common.Errors;
using WhitePlate.Application.Common.Results;
using WhitePlate.Application.Identity;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public sealed class CreateStaffInvitationCommandHandler(IStaffMembershipRepository memberships,
    IStaffInvitationRepository invitations, TimeProvider timeProvider)
{
    public async Task<Result<StaffInvitationDto>> HandleAsync(CreateStaffInvitationCommand command,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(command);
        cancellationToken.ThrowIfCancellationRequested();
        if (!command.Identity.EmailVerified || string.IsNullOrWhiteSpace(command.Identity.Email))
            return Result<StaffInvitationDto>.Failure(new ApplicationError(ErrorCode.Forbidden));
        if (!await memberships.IsOrganizationOwnerAsync(command.OrganizationId, command.Identity, cancellationToken))
            return Result<StaffInvitationDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        if ((command.Role == InvitationRole.OrganizationOwner) != (command.TenantId is null) ||
            command.TenantId == Guid.Empty)
            return Result<StaffInvitationDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue("tenantId", "invalid_invitation_scope", "Invitation role and restaurant scope do not match.")));
        if (command.TenantId is Guid tenantId &&
            !await invitations.TenantBelongsToOrganizationAsync(command.OrganizationId, tenantId, cancellationToken))
            return Result<StaffInvitationDto>.Failure(new ApplicationError(ErrorCode.NotFound));

        var now = timeProvider.GetUtcNow();
        var (token, hash) = InvitationToken.Create();
        StaffInvitation invitation;
        try
        {
            invitation = StaffInvitation.Create(command.OrganizationId, command.TenantId, command.Role,
                command.RecipientEmail, hash, now.AddDays(7), now);
        }
        catch (WhitePlate.Domain.Common.DomainRuleException exception)
        {
            return Result<StaffInvitationDto>.Failure(new ApplicationError(ErrorCode.ValidationFailed,
                new ValidationIssue(exception.Field, exception.Code, exception.Message)));
        }
        await invitations.AddAsync(invitation, cancellationToken);
        return Result<StaffInvitationDto>.Success(new StaffInvitationDto(invitation.Id, token, invitation.ExpiresAt));
    }
}
