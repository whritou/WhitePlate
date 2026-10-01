import { isRecord, isUuid } from "./common"
import type {
  CatalogTranslationInput,
  MenuLanguagesInput,
  StaffInvitationInput,
  StaffRole,
} from "@/types/actions"

export function parseMenuLanguages(input: unknown): MenuLanguagesInput | null {
  if (
    !isRecord(input) ||
    !isUuid(input.tenantId) ||
    typeof input.defaultLocale !== "string" ||
    !Array.isArray(input.locales) ||
    input.locales.length === 0 ||
    input.locales.some(
      (locale) =>
        typeof locale !== "string" || locale.length === 0 || locale.length > 255
    ) ||
    !input.locales.includes(input.defaultLocale)
  )
    return null
  return {
    tenantId: input.tenantId,
    locales: [...input.locales],
    defaultLocale: input.defaultLocale,
  }
}

export function parseCatalogTranslation(
  input: unknown
): CatalogTranslationInput | null {
  const validTypes = ["categories", "products", "option-groups", "options"]
  if (
    !isRecord(input) ||
    !isUuid(input.tenantId) ||
    !isUuid(input.entityId) ||
    typeof input.entityType !== "string" ||
    !validTypes.includes(input.entityType) ||
    typeof input.locale !== "string" ||
    !input.locale ||
    input.locale.length > 255 ||
    typeof input.name !== "string" ||
    !input.name.trim() ||
    input.name.length > (input.entityType === "products" ? 160 : 120) ||
    (input.description !== null &&
      (typeof input.description !== "string" ||
        input.description.length > 1000))
  )
    return null
  return {
    tenantId: input.tenantId,
    entityType: input.entityType as CatalogTranslationInput["entityType"],
    entityId: input.entityId,
    locale: input.locale,
    name: input.name,
    description: input.description as string | null,
  }
}

export function parseOrganizationName(form: unknown): string | null {
  if (!(form instanceof FormData)) return null
  const name = form.get("name")
  return typeof name === "string" && name.trim() && name.trim().length <= 200
    ? name.trim()
    : null
}

export function parseStaffInvitation(
  form: unknown
): StaffInvitationInput | null {
  if (!(form instanceof FormData)) return null
  const organizationId = form.get("organizationId")
  const tenantId = form.get("tenantId") || null
  const rawEmail = form.get("email")
  const role = form.get("role")
  const email = typeof rawEmail === "string" ? rawEmail.trim() : ""
  if (
    !isUuid(organizationId) ||
    (tenantId !== null && !isUuid(tenantId)) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    typeof role !== "string" ||
    !["OrganizationOwner", "RestaurantManager", "KitchenStaff"].includes(
      role
    ) ||
    (role === "OrganizationOwner" ? tenantId !== null : tenantId === null)
  )
    return null
  return {
    organizationId,
    tenantId,
    email,
    role: role as StaffRole,
    locale: form.get("locale") === "fr" ? "fr" : "en",
  }
}
