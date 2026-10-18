using WhitePlate.Application.Staff;
using WhitePlate.Domain.Identity;

namespace WhitePlate.Tests.Application;

public sealed class CreateStaffInvitationCommandTests
{
    [Theory]
    [InlineData("RestaurantManager", "Manager", InvitationRole.RestaurantManager)]
    [InlineData("KitchenStaff", "Kitchen", InvitationRole.KitchenStaff)]
    [InlineData("RestaurantStaff", "Staff", InvitationRole.RestaurantStaff)]
    public void LegacyInvitationRoleNamesResolveToStableRoleIds(string requestedRole, string stableRoleId,
        InvitationRole compatibilityRole)
    {
        var command = CreateCommand(requestedRole);

        Assert.Equal(stableRoleId, command.RoleId);
        Assert.Equal(compatibilityRole, command.Role);
    }

    [Fact]
    public void OrganizationOwnerInvitationHasNoRestaurantRoleId()
    {
        var command = CreateCommand("OrganizationOwner");

        Assert.Null(command.RoleId);
        Assert.Equal(InvitationRole.OrganizationOwner, command.Role);
    }

    [Fact]
    public void CustomRoleIdIsPreservedForPersistence()
    {
        var customRoleId = Guid.NewGuid().ToString("N");
        var command = CreateCommand(customRoleId);

        Assert.Equal(customRoleId, command.RoleId);
        Assert.Equal(InvitationRole.RestaurantStaff, command.Role);
    }

    private static CreateStaffInvitationCommand CreateCommand(string requestedRole) => new(Guid.NewGuid(),
        Guid.NewGuid(), "staff@example.test", requestedRole,
        ExternalIdentity.Create("https://identity.example.test/", "owner", "owner@example.test", true));
}
