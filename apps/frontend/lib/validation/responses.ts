import { isRecord, isUuid } from "./common"
import { parseMenuLanguages } from "./organization"
import type { StorefrontMenu, Product } from "@/types/storefront"
import type {
  CatalogTranslationData,
  MenuLanguageSettings,
  LocalizedText,
} from "@/types/catalog"
import type {
  Organization,
  OrganizationInvitationStatus,
  OrganizationTeamInvitation,
  OrganizationTeamMember,
  OrganizationTeamRole,
  Restaurant,
} from "@/types/organization"

const isAmount = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
const isCount = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0
const isDescription = (value: unknown): value is string | null =>
  value === null || typeof value === "string"

export function parseOrganizations(value: unknown): Organization[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.isActive === "boolean"
    )
  )
    return null

  return value.map((item) => ({
    id: item.id,
    name: item.name,
    isActive: item.isActive,
  }))
}

export function parseRestaurants(value: unknown): Restaurant[] | null {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.subdomain === "string" &&
        typeof item.currency === "string"
    )
  )
    return null

  return value.map((item) => ({
    id: item.id,
    name: item.name,
    subdomain: item.subdomain,
    currency: item.currency,
  }))
}

const organizationTeamRoles: OrganizationTeamRole[] = [
  "OrganizationOwner",
  "RestaurantManager",
  "KitchenStaff",
]

function isOrganizationTeamMember(
  value: unknown
): value is OrganizationTeamMember {
  if (
    !isRecord(value) ||
    !organizationTeamRoles.includes(value.role as OrganizationTeamRole) ||
    !(value.email === null || typeof value.email === "string")
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

  return value.map(({ role, email, tenantId, tenantName }) => ({
    role,
    email,
    tenantId,
    tenantName,
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

  return value.map(
    ({ id, role, email, tenantId, tenantName, expiresAt, status }) => ({
      id,
      role,
      email,
      tenantId,
      tenantName,
      expiresAt,
      status,
    })
  )
}

export function parseMenuLanguageSettings(
  value: unknown
): MenuLanguageSettings | null {
  return parseMenuLanguages(value)
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    isDescription(value.description)
  )
}

function isTranslations(
  value: unknown
): value is Record<string, LocalizedText> {
  return isRecord(value) && Object.values(value).every(isLocalizedText)
}

function isCatalogItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    typeof value.isArchived === "boolean" &&
    isTranslations(value.translations)
  )
}

export function parseCatalog(value: unknown): CatalogTranslationData | null {
  if (
    !isRecord(value) ||
    ![
      value.categories,
      value.products,
      value.optionGroups,
      value.options,
    ].every((items) => Array.isArray(items) && items.every(isCatalogItem))
  )
    return null
  if (
    !(value.products as unknown[]).every(
      (item) =>
        isRecord(item) &&
        isUuid(item.categoryId) &&
        isDescription(item.description)
    ) ||
    !(value.optionGroups as unknown[]).every(
      (item) => isRecord(item) && isUuid(item.productId)
    ) ||
    !(value.options as unknown[]).every(
      (item) => isRecord(item) && isUuid(item.groupId)
    )
  )
    return null

  return {
    categories: value.categories,
    products: value.products,
    optionGroups: value.optionGroups,
    options: value.options,
  } as CatalogTranslationData
}

function isOptionGroup(value: unknown): boolean {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    isCount(value.minimumSelections) &&
    isCount(value.maximumSelections) &&
    value.minimumSelections <= value.maximumSelections &&
    Array.isArray(value.options) &&
    value.options.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        isAmount(item.priceAdjustment)
    )
  )
}

function isProduct(value: unknown): value is Product {
  return (
    isRecord(value) &&
    isUuid(value.id) &&
    typeof value.name === "string" &&
    isDescription(value.description) &&
    isAmount(value.basePrice) &&
    typeof value.isAvailable === "boolean" &&
    Array.isArray(value.optionGroups) &&
    value.optionGroups.every(isOptionGroup)
  )
}

export function parseStorefrontMenu(value: unknown): StorefrontMenu | null {
  if (
    !isRecord(value) ||
    !isUuid(value.tenantId) ||
    typeof value.restaurantName !== "string" ||
    typeof value.currency !== "string" ||
    !/^[A-Z]{3}$/.test(value.currency) ||
    typeof value.locale !== "string" ||
    !parseMenuLanguages({
      tenantId: value.tenantId,
      locales: value.availableLocales,
      defaultLocale: value.defaultLocale,
    }) ||
    !(value.availableLocales as string[]).includes(value.locale) ||
    !Array.isArray(value.categories) ||
    !value.categories.every(
      (item) =>
        isRecord(item) &&
        isUuid(item.id) &&
        typeof item.name === "string" &&
        typeof item.sortOrder === "number" &&
        Number.isSafeInteger(item.sortOrder) &&
        Array.isArray(item.products) &&
        item.products.every(isProduct)
    )
  )
    return null

  return {
    tenantId: value.tenantId,
    restaurantName: value.restaurantName,
    currency: value.currency,
    locale: value.locale,
    defaultLocale: value.defaultLocale,
    availableLocales: value.availableLocales,
    categories: value.categories,
  } as StorefrontMenu
}
