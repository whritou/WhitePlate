import { isRecord, isUuid } from "./common"
import type {
  OrganizationInvitationStatus,
  OrganizationRoleAssignmentOption,
  OrganizationRoleGrant,
  OrganizationTeamInvitation,
  OrganizationTeamMember,
  OrganizationTeamRole,
  RestaurantPermissionKey,
} from "@/types/organization"

const organizationTeamRoles: OrganizationTeamRole[] = [
  "OrganizationOwner",
  "RestaurantManager",
  "KitchenStaff",
  "RestaurantStaff",
  "Accountant",
]

const restaurantPermissionKeys: RestaurantPermissionKey[] = [
  "orders.manage",
  "kitchen.display",
  "catalog.manage",
  "discounts.manage",
  "analytics.view",
  "storefront.manage",
  "staff.manage",
  "billing.manage",
]

const builtInOrganizationRoles = ["Manager", "Kitchen", "Staff", "Accountant"]
const requiredBuiltInOrganizationRoles = ["Manager", "Kitchen", "Accountant"]

function parseOrganizationRoleGrantItem(
  value: unknown
): OrganizationRoleGrant | null {
  if (
    !isRecord(value) ||
    typeof value.role !== "string" ||
    !value.role.trim() ||
    value.role.length > 80 ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    value.name.trim().length > 60 ||
    !(
      value.builtInKey === null ||
      builtInOrganizationRoles.includes(value.builtInKey as string) ||
      value.builtInKey === "OrganizationOwner"
    ) ||
    !Array.isArray(value.permissions) ||
    !value.permissions.every((permission) =>
      restaurantPermissionKeys.includes(permission as RestaurantPermissionKey)
    ) ||
    new Set(value.permissions).size !== value.permissions.length ||
    typeof value.version !== "number" ||
    !Number.isSafeInteger(value.version) ||
    value.version < 0 ||
    typeof value.isProtected !== "boolean" ||
    typeof value.isBuiltIn !== "boolean" ||
    typeof value.isArchived !== "boolean"
  )
    return null

  const permissions = value.permissions as RestaurantPermissionKey[]

  if (value.role === "OrganizationOwner") {
    if (
      !value.isProtected ||
      !value.isBuiltIn ||
      value.builtInKey !== "OrganizationOwner" ||
      value.isArchived ||
      value.version !== 0 ||
      restaurantPermissionKeys.some(
        (permission) => !permissions.includes(permission)
      )
    )
      return null
  } else if (
    value.isProtected ||
    value.version < 1 ||
    (value.isBuiltIn &&
      (typeof value.builtInKey !== "string" ||
        value.role !== value.builtInKey)) ||
    (!value.isBuiltIn && value.builtInKey !== null)
  )
    return null

  return {
    role: value.role,
    name: value.name.trim(),
    builtInKey: value.builtInKey as string | null,
    permissions,
    version: value.version,
    isProtected: value.isProtected,
    isBuiltIn: value.isBuiltIn,
    isArchived: value.isArchived,
  }
}

export function parseOrganizationRoleGrant(
  value: unknown
): OrganizationRoleGrant | null {
  return parseOrganizationRoleGrantItem(value)
}

export function parseOrganizationRoleGrants(
  value: unknown
): OrganizationRoleGrant[] | null {
  if (!Array.isArray(value)) return null

  const grants: OrganizationRoleGrant[] = []
  const roles = new Set<string>()
  const builtIns = new Set<string>()

  for (const item of value) {
    const grant = parseOrganizationRoleGrantItem(item)

    if (!grant || roles.has(grant.role)) return null
    roles.add(grant.role)
    if (grant.isBuiltIn && grant.builtInKey) builtIns.add(grant.builtInKey)
    grants.push(grant)
  }

  return grants.filter((grant) => grant.isProtected).length === 1 &&
    requiredBuiltInOrganizationRoles.every((role) => builtIns.has(role))
    ? grants
    : null
}

export function parseOrganizationRoleAssignmentOptions(
  value: unknown
): OrganizationRoleAssignmentOption[] | null {
  if (!Array.isArray(value)) return null

  const roles = new Set<string>()
  const options: OrganizationRoleAssignmentOption[] = []

  for (const item of value) {
    if (
      !isRecord(item) ||
      typeof item.role !== "string" ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(item.role) ||
      item.role === "OrganizationOwner" ||
      roles.has(item.role) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.trim().length > 60 ||
      !(
        item.builtInKey === null ||
        builtInOrganizationRoles.includes(item.builtInKey as string)
      ) ||
      (item.builtInKey !== null && item.role !== item.builtInKey)
    )
      return null

    roles.add(item.role)
    options.push({
      role: item.role,
      name: item.name.trim(),
      builtInKey: item.builtInKey as string | null,
    })
  }

  return options
}

function isOrganizationTeamMember(
  value: unknown
): value is OrganizationTeamMember {
  if (
    !isRecord(value) ||
    !organizationTeamRoles.includes(value.role as OrganizationTeamRole) ||
    !(value.email === null || typeof value.email === "string") ||
    (value.memberId !== undefined &&
      !(value.memberId === null || isUuid(value.memberId))) ||
    (value.roleId !== undefined &&
      !(
        value.roleId === null ||
        (typeof value.roleId === "string" &&
          /^[A-Za-z0-9_-]{1,80}$/.test(value.roleId))
      )) ||
    (value.roleName !== undefined &&
      !(
        value.roleName === null ||
        (typeof value.roleName === "string" &&
          value.roleName.trim().length > 0 &&
          value.roleName.trim().length <= 60)
      )) ||
    (value.builtInKey !== undefined &&
      !(
        value.builtInKey === null ||
        value.builtInKey === "OrganizationOwner" ||
        builtInOrganizationRoles.includes(value.builtInKey as string)
      ))
  )
    return false

  const organizationOwner = value.role === "OrganizationOwner"

  return organizationOwner
    ? value.tenantId === null && value.tenantName === null
    : isUuid(value.tenantId) && typeof value.tenantName === "string"
}

export function parseOrganizationMembers(
  value: unknown
): OrganizationTeamMember[] | null {
  if (!Array.isArray(value) || !value.every(isOrganizationTeamMember))
    return null

  return value.map((item) => ({
    role: item.role as OrganizationTeamRole,
    email: item.email as string | null,
    tenantId: item.tenantId as string | null,
    tenantName: item.tenantName as string | null,
    ...(item.memberId !== undefined
      ? { memberId: item.memberId as string | null }
      : {}),
    ...(item.roleId !== undefined
      ? { roleId: item.roleId as string | null }
      : {}),
    ...(item.roleName !== undefined
      ? { roleName: item.roleName as string | null }
      : {}),
    ...(item.builtInKey !== undefined
      ? { builtInKey: item.builtInKey as string | null }
      : {}),
  }))
}

const invitationStatuses: OrganizationInvitationStatus[] = [
  "Pending",
  "Accepted",
  "Revoked",
  "Expired",
]

function isOrganizationTeamInvitation(
  value: unknown
): value is OrganizationTeamInvitation {
  if (
    !isRecord(value) ||
    !isUuid(value.id) ||
    !organizationTeamRoles.includes(value.role as OrganizationTeamRole) ||
    (value.roleId !== undefined &&
      !(
        value.roleId === null ||
        (typeof value.roleId === "string" &&
          /^[A-Za-z0-9_-]{1,80}$/.test(value.roleId))
      )) ||
    (value.roleName !== undefined &&
      !(
        value.roleName === null ||
        (typeof value.roleName === "string" &&
          value.roleName.trim().length > 0 &&
          value.roleName.trim().length <= 60)
      )) ||
    (value.builtInKey !== undefined &&
      !(
        value.builtInKey === null ||
        value.builtInKey === "OrganizationOwner" ||
        builtInOrganizationRoles.includes(value.builtInKey as string)
      )) ||
    typeof value.email !== "string" ||
    !invitationStatuses.includes(
      value.status as OrganizationInvitationStatus
    ) ||
    typeof value.expiresAt !== "string" ||
    !Number.isFinite(Date.parse(value.expiresAt))
  )
    return false

  return value.role === "OrganizationOwner"
    ? value.tenantId === null && value.tenantName === null
    : isUuid(value.tenantId) && typeof value.tenantName === "string"
}

export function parseOrganizationInvitations(
  value: unknown
): OrganizationTeamInvitation[] | null {
  if (!Array.isArray(value) || !value.every(isOrganizationTeamInvitation))
    return null

  return value.map((item) => ({
    id: item.id as string,
    role: item.role as OrganizationTeamRole,
    email: item.email as string,
    tenantId: item.tenantId as string | null,
    tenantName: item.tenantName as string | null,
    expiresAt: item.expiresAt as string,
    status: item.status as OrganizationInvitationStatus,
    ...(item.roleId !== undefined
      ? { roleId: item.roleId as string | null }
      : {}),
    ...(item.roleName !== undefined
      ? { roleName: item.roleName as string | null }
      : {}),
    ...(item.builtInKey !== undefined
      ? { builtInKey: item.builtInKey as string | null }
      : {}),
  }))
}
