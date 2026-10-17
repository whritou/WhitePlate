"use server"

import { isInvitationToken, isRecord, isUuid } from "@/lib/validation/common"
import {
  parseMenuLanguages,
  parseRestaurantDescriptionTranslation,
  parseCatalogTranslation,
  parseCatalogTranslationDecision,
  parseCatalogTranslationGlossary,
  parseCatalogTranslationGlossaryDelete,
  parseOrganizationLegalProfile,
  parseOrganizationRename,
  parseStaffInvitation,
  parseOrganizationRoleGrant,
} from "@/lib/validation/organization"
import {
  updateMenuLanguages,
  saveRestaurantDescriptionTranslation,
  saveCatalogTranslation,
  decideCatalogTranslation,
  saveCatalogTranslationGlossary,
  deleteCatalogTranslationGlossary,
  createOrganization,
  renameOrganization,
  sendStaffInvitation,
  revokeStaffInvitation,
  acceptStaffInvitation,
  setOrganizationActive,
  saveOrganizationRoleGrant,
} from "@/services/organization"
import type {
  ActionResult,
  CatalogTranslationSaveResult,
  OrganizationRoleGrantSaveResult,
} from "@/types/organization"

export async function updateMenuLanguagesAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseMenuLanguages(input)

  return value ? updateMenuLanguages(value) : { ok: false, message: "invalid" }
}

export async function saveRestaurantDescriptionTranslationAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseRestaurantDescriptionTranslation(input)

  return value
    ? saveRestaurantDescriptionTranslation(value)
    : { ok: false, message: "invalid" }
}

export async function saveCatalogTranslationAction(
  input: unknown
): Promise<CatalogTranslationSaveResult> {
  const value = parseCatalogTranslation(input)

  return value
    ? saveCatalogTranslation(value)
    : { ok: false, message: "invalid" }
}

export async function decideCatalogTranslationAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseCatalogTranslationDecision(input)

  return value
    ? decideCatalogTranslation(value)
    : { ok: false, message: "invalid" }
}

export async function saveCatalogTranslationGlossaryAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseCatalogTranslationGlossary(input)

  return value
    ? saveCatalogTranslationGlossary(value)
    : { ok: false, message: "invalid" }
}

export async function deleteCatalogTranslationGlossaryAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseCatalogTranslationGlossaryDelete(input)

  return value
    ? deleteCatalogTranslationGlossary(value)
    : { ok: false, message: "invalid" }
}

export async function createOrganizationAction(
  form: unknown
): Promise<ActionResult> {
  const profile = parseOrganizationLegalProfile(form)

  return profile
    ? createOrganization(profile)
    : { ok: false, message: "invalid" }
}

export async function saveOrganizationLegalProfileAction(
  input: unknown
): Promise<ActionResult> {
  if (
    !isRecord(input) ||
    !isUuid(input.organizationId) ||
    !Number.isSafeInteger(input.version) ||
    typeof input.version !== "number" ||
    input.version < 1 ||
    typeof input.legalCountryCode !== "string" ||
    !["FR", "DE", "GB", "US"].includes(input.legalCountryCode) ||
    [input.legalName, input.legalRegistrationNumber, input.taxIdentifier].some(
      (value) =>
        value !== null && (typeof value !== "string" || value.length > 200)
    )
  )
    return { ok: false, message: "invalid" }

  const { saveOrganizationLegalProfile } =
    await import("@/services/organization")

  return saveOrganizationLegalProfile(
    input as {
      organizationId: string
      version: number
      legalCountryCode: string
      legalName: string | null
      legalRegistrationNumber: string | null
      taxIdentifier: string | null
    }
  )
}

export async function renameOrganizationAction(
  form: unknown
): Promise<ActionResult> {
  const value = parseOrganizationRename(form)

  return value ? renameOrganization(value) : { ok: false, message: "invalid" }
}

export async function setOrganizationActiveAction(
  input: unknown
): Promise<ActionResult> {
  if (
    !isRecord(input) ||
    !isUuid(input.organizationId) ||
    typeof input.active !== "boolean"
  )
    return { ok: false, message: "invalid" }

  return setOrganizationActive(input.organizationId, input.active)
}

export async function sendStaffInvitationAction(
  form: unknown
): Promise<ActionResult> {
  const value = parseStaffInvitation(form)

  return value ? sendStaffInvitation(value) : { ok: false, message: "invalid" }
}

export async function saveOrganizationRoleGrantAction(
  input: unknown
): Promise<OrganizationRoleGrantSaveResult> {
  const value = parseOrganizationRoleGrant(input)

  return value
    ? saveOrganizationRoleGrant(value)
    : { ok: false, message: "invalid" }
}

export async function revokeStaffInvitationAction(
  input: unknown
): Promise<ActionResult> {
  if (
    !isRecord(input) ||
    !isUuid(input.organizationId) ||
    !isUuid(input.invitationId)
  )
    return { ok: false, message: "invalid" }

  return revokeStaffInvitation({
    organizationId: input.organizationId,
    invitationId: input.invitationId,
  })
}

export async function acceptStaffInvitationAction(
  token: unknown
): Promise<ActionResult> {
  return isInvitationToken(token)
    ? acceptStaffInvitation(token)
    : { ok: false, message: "invalid" }
}
