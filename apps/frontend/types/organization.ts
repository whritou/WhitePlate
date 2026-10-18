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
  role: string
  name: string
  builtInKey: string | null
  permissions: RestaurantPermissionKey[]
  version: number
  isProtected: boolean
  isBuiltIn: boolean
  isArchived: boolean
}

export type OrganizationRoleGrantInput = {
  organizationId: string
  role: string
  name?: string
  permissions: RestaurantPermissionKey[]
  version: number
}

export type OrganizationRoleAssignmentOption = {
  role: string
  name: string
  builtInKey: string | null
}

export type OrganizationInvitationStatus =
  "Pending" | "Accepted" | "Revoked" | "Expired"

export type OrganizationTeamMember = {
  role: OrganizationTeamRole
  email: string | null
  tenantId: string | null
  tenantName: string | null
  memberId?: string | null
  roleId?: string | null
  roleName?: string | null
  builtInKey?: string | null
}

export type OrganizationTeamInvitation = {
  id: string
  role: OrganizationTeamRole
  email: string
  tenantId: string | null
  tenantName: string | null
  expiresAt: string
  status: OrganizationInvitationStatus
  roleId?: string | null
  roleName?: string | null
  builtInKey?: string | null
}

export type OrganizationRoleOption = OrganizationRoleAssignmentOption

export type OrganizationTeamDirectoryProps = {
  organizationId: string
  members: OrganizationTeamMember[] | null
  invitations: OrganizationTeamInvitation[] | null
  roleGrants: OrganizationRoleGrant[] | null
  roleOptions: OrganizationRoleAssignmentOption[] | null
  isOrganizationOwner: boolean
}

export type OrganizationRoleGrantSaveResult =
  | { ok: true; grant: OrganizationRoleGrant }
  | { ok: false; message: ActionErrorMessage }

export type OrganizationRoleGrantCreateResult = OrganizationRoleGrantSaveResult

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
