export type ActionErrorMessage = "unauthorized" | "invalid" | "unavailable"

export type ActionResult =
  { ok: true } | { ok: false; message: ActionErrorMessage }

export type CatalogTranslationSaveResult =
  | { ok: true; unchanged: boolean; status: "Pending" | "Unchanged" }
  | { ok: false; message: ActionErrorMessage }

export type Organization = {
  id: string
  name: string
  isActive: boolean
  legalCountryCode?: string | null
  legalName?: string | null
  legalRegistrationNumber?: string | null
  taxIdentifier?: string | null
  legalProfileVersion?: number
}

export type OrganizationTeamRole =
  | "OrganizationOwner"
  | "RestaurantManager"
  | "KitchenStaff"
  | "RestaurantStaff"
  | "Accountant"

export type RestaurantPermissionKey =
  | "orders.manage"
  | "kitchen.display"
  | "catalog.manage"
  | "discounts.manage"
  | "analytics.view"
  | "storefront.manage"
  | "staff.manage"
  | "billing.manage"

export type OrganizationRoleGrant = {
  role: "OrganizationOwner" | "Manager" | "Kitchen" | "Staff" | "Accountant"
  permissions: RestaurantPermissionKey[]
  version: number
  isProtected: boolean
}

export type OrganizationRoleGrantInput = {
  organizationId: string
  role: Exclude<OrganizationRoleGrant["role"], "OrganizationOwner">
  permissions: RestaurantPermissionKey[]
  version: number
}

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
  roleGrants: OrganizationRoleGrant[] | null
  isOrganizationOwner: boolean
}

export type OrganizationRoleGrantSaveResult =
  | { ok: true; grant: OrganizationRoleGrant }
  | { ok: false; message: ActionErrorMessage }

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
