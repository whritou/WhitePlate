"use server"

import { isInvitationToken } from "@/lib/validation/common"
import {
  parseMenuLanguages,
  parseCatalogTranslation,
  parseOrganizationName,
  parseStaffInvitation,
} from "@/lib/validation/organization"
import {
  updateMenuLanguages,
  saveCatalogTranslation,
  createOrganization,
  sendStaffInvitation,
  acceptStaffInvitation,
} from "@/services/organization"
import type { ActionResult } from "@/types/organization"

export async function updateMenuLanguagesAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseMenuLanguages(input)

  return value ? updateMenuLanguages(value) : { ok: false, message: "invalid" }
}

export async function saveCatalogTranslationAction(
  input: unknown
): Promise<ActionResult> {
  const value = parseCatalogTranslation(input)

  return value
    ? saveCatalogTranslation(value)
    : { ok: false, message: "invalid" }
}

export async function createOrganizationAction(
  form: unknown
): Promise<ActionResult> {
  const name = parseOrganizationName(form)

  return name ? createOrganization(name) : { ok: false, message: "invalid" }
}

export async function sendStaffInvitationAction(
  form: unknown
): Promise<ActionResult> {
  const value = parseStaffInvitation(form)

  return value ? sendStaffInvitation(value) : { ok: false, message: "invalid" }
}

export async function acceptStaffInvitationAction(
  token: unknown
): Promise<ActionResult> {
  return isInvitationToken(token)
    ? acceptStaffInvitation(token)
    : { ok: false, message: "invalid" }
}
