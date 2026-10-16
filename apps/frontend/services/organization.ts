import "server-only"
import { isInvitationToken, isRecord, isUuid } from "@/lib/validation/common"
import { sendInvitationEmail } from "@/lib/email"
import { whitePlateApi } from "@/lib/api"
import type {
  ActionResult,
  CatalogTranslationSaveResult,
} from "@/types/organization"
import type { ApiResult } from "@/types/api"
import type {
  CatalogTranslationInput,
  CatalogTranslationDecisionInput,
  CatalogTranslationGlossaryInput,
  CatalogTranslationGlossaryDeleteInput,
  MenuLanguagesInput,
  RestaurantDescriptionTranslationInput,
  OrganizationRenameInput,
  RevokeStaffInvitationInput,
  StaffInvitationInput,
} from "@/types/actions"

function actionResult(response: ApiResult<unknown>): ActionResult {
  if (response.ok) return { ok: true }

  const message =
    response.error === "unauthorized"
      ? "unauthorized"
      : ["invalid", "not_found", "conflict"].includes(response.error)
        ? "invalid"
        : "unavailable"

  return { ok: false, message }
}

export async function updateMenuLanguages({
  tenantId,
  locales,
  defaultLocale,
}: MenuLanguagesInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.put(`/api/v1/tenants/${tenantId}/menu-languages`, {
      locales,
      defaultLocale,
    })
  )
}

export async function saveRestaurantDescriptionTranslation({
  tenantId,
  locale,
  description,
}: RestaurantDescriptionTranslationInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.put(
      `/api/v1/tenants/${tenantId}/restaurant-description-translations/${encodeURIComponent(locale)}`,
      { description }
    )
  )
}

export async function saveCatalogTranslation({
  tenantId,
  entityType,
  entityId,
  locale,
  name,
  description,
}: CatalogTranslationInput): Promise<CatalogTranslationSaveResult> {
  const response = await whitePlateApi.put<unknown>(
    `/api/v1/tenants/${tenantId}/catalog/${entityType}/${entityId}/translation`,
    { locale, name, description }
  )

  if (!response.ok) {
    const result = actionResult(response)

    return result.ok ? { ok: false, message: "unavailable" } : result
  }

  if (
    !isRecord(response.data) ||
    typeof response.data.unchanged !== "boolean" ||
    (response.data.status !== "Pending" && response.data.status !== "Unchanged")
  )
    return { ok: false, message: "unavailable" }

  return {
    ok: true,
    unchanged: response.data.unchanged,
    status: response.data.status,
  }
}

export async function decideCatalogTranslation({
  tenantId,
  reviewId,
  expectedVersion,
  decision,
}: CatalogTranslationDecisionInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.post(
      `/api/v1/tenants/${tenantId}/catalog/translation-reviews/${reviewId}/${decision}`,
      { expectedVersion }
    )
  )
}

export async function saveCatalogTranslationGlossary({
  tenantId,
  id,
  sourceLocale,
  targetLocale,
  sourceTerm,
  targetTerm,
}: CatalogTranslationGlossaryInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.put(
      `/api/v1/tenants/${tenantId}/catalog/translation-glossary`,
      { id, sourceLocale, targetLocale, sourceTerm, targetTerm }
    )
  )
}

export async function deleteCatalogTranslationGlossary({
  tenantId,
  id,
}: CatalogTranslationGlossaryDeleteInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.delete(
      `/api/v1/tenants/${tenantId}/catalog/translation-glossary/${id}`
    )
  )
}

export async function createOrganization(profile: {
  name: string
  legalCountryCode: string
  legalName: string | null
  legalRegistrationNumber: string | null
  taxIdentifier: string | null
}): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.post("/api/v1/organizations", profile)
  )
}

export async function saveOrganizationLegalProfile(input: {
  organizationId: string
  version: number
  legalCountryCode: string
  legalName: string | null
  legalRegistrationNumber: string | null
  taxIdentifier: string | null
}): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.put(
      `/api/v1/organizations/${input.organizationId}/legal-profile`,
      {
        legalCountryCode: input.legalCountryCode,
        legalName: input.legalName,
        legalRegistrationNumber: input.legalRegistrationNumber,
        taxIdentifier: input.taxIdentifier,
      },
      { ifMatch: `"${input.version}"` }
    )
  )
}

export async function renameOrganization({
  organizationId,
  name,
}: OrganizationRenameInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.patch(`/api/v1/organizations/${organizationId}`, {
      name,
    })
  )
}

export async function setOrganizationActive(
  organizationId: string,
  active: boolean
): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.post(
      `/api/v1/organizations/${organizationId}/${active ? "restore" : "archive"}`,
      {}
    )
  )
}

export async function acceptStaffInvitation(
  token: string
): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.post("/api/v1/invitations/accept", { token })
  )
}

export async function revokeStaffInvitation({
  organizationId,
  invitationId,
}: RevokeStaffInvitationInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.delete(
      `/api/v1/organizations/${organizationId}/invitations/${invitationId}`
    )
  )
}

export async function sendStaffInvitation({
  organizationId,
  tenantId,
  email,
  role,
  locale,
}: StaffInvitationInput): Promise<ActionResult> {
  const response = await whitePlateApi.post<unknown>(
    `/api/v1/organizations/${organizationId}/invitations`,
    { tenantId, email, role }
  )

  if (!response.ok) return actionResult(response)

  const invitation = response.data
  const id =
    isRecord(invitation) && isUuid(invitation.id) ? invitation.id : null
  const token =
    isRecord(invitation) && isInvitationToken(invitation.token)
      ? invitation.token
      : null
  const delivered =
    id && token
      ? await sendInvitationEmail({ to: email, token, locale })
      : false

  if (!delivered) {
    if (id)
      await whitePlateApi.delete(
        `/api/v1/organizations/${organizationId}/invitations/${id}`
      )

    return { ok: false, message: "unavailable" }
  }

  return { ok: true }
}
