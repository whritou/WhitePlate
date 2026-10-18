using WhitePlate.Domain.Identity;

namespace WhitePlate.Application.Staff;

public sealed record CreateStaffInvitationCommand(Guid OrganizationId, Guid? TenantId, string RecipientEmail,
    string RequestedRoleId, ExternalIdentity Identity)
{
    public string? RoleId => RequestedRoleId switch
    {
        "OrganizationOwner" => null,
        "RestaurantManager" => "Manager",
        "KitchenStaff" => "Kitchen",
        "RestaurantStaff" => "Staff",
        _ => RequestedRoleId
    };

    public InvitationRole Role => RequestedRoleId switch
    {
        "OrganizationOwner" => InvitationRole.OrganizationOwner,
        "Manager" or "RestaurantManager" => InvitationRole.RestaurantManager,
        "Kitchen" or "KitchenStaff" => InvitationRole.KitchenStaff,
        "Staff" or "RestaurantStaff" => InvitationRole.RestaurantStaff,
        "Accountant" => InvitationRole.Accountant,
        _ => InvitationRole.RestaurantStaff
    };

    public CreateStaffInvitationCommand(Guid organizationId, Guid? tenantId, string recipientEmail,
        InvitationRole role, ExternalIdentity identity)
        : this(organizationId, tenantId, recipientEmail, ToRoleId(role), identity) { }

    private static string ToRoleId(InvitationRole role) => role switch
    {
        InvitationRole.OrganizationOwner => "OrganizationOwner",
        InvitationRole.RestaurantManager => "Manager",
        InvitationRole.KitchenStaff => "Kitchen",
        InvitationRole.RestaurantStaff => "Staff",
        InvitationRole.Accountant => "Accountant",
        _ => string.Empty
    };
}
