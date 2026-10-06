export type ActionErrorMessage = "unauthorized" | "invalid" | "unavailable"

export type ActionResult =
  { ok: true } | { ok: false; message: ActionErrorMessage }

export type Organization = { id: string; name: string }

export type OrganizationTeamRole =
  "OrganizationOwner" | "RestaurantManager" | "KitchenStaff"

export type OrganizationInvitationStatus =
  "Pending" | "Accepted" | "Revoked" | "Expired"

export type OrganizationTeamMember = {
  role: OrganizationTeamRole
  email: string | null
  tenantId: string | null
  tenantName: string | null
}

export type OrganizationTeamInvitation = {
  id: string
  role: OrganizationTeamRole
  email: string
  tenantId: string | null
  tenantName: string | null
  expiresAt: string
  status: OrganizationInvitationStatus
}

export type OrganizationTeamDirectoryProps = {
  organizationId: string
  members: OrganizationTeamMember[] | null
  invitations: OrganizationTeamInvitation[] | null
}

export type CurrentUser = {
  restaurants: { id: string; name: string; role: string }[]
}

export type Restaurant = {
  id: string
  name: string
  subdomain: string
  currency: string
}

export type ActionState = {
  status: "idle" | "pending" | "success" | "error"
  error?: string
}
