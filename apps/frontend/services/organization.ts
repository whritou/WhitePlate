import "server-only"
import { isInvitationToken, isRecord, isUuid } from "@/lib/validation/common"
import { sendInvitationEmail } from "@/lib/email"
import { whitePlateApi } from "@/lib/api"
import type { ActionResult } from "@/types/organization"
import type { ApiResult } from "@/types/api"
import type {
  CatalogTranslationInput,
  MenuLanguagesInput,
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

export async function saveCatalogTranslation({
  tenantId,
  entityType,
  entityId,
  locale,
  name,
  description,
}: CatalogTranslationInput): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.put(
      `/api/v1/tenants/${tenantId}/catalog/${entityType}/${entityId}/translation`,
      { locale, name, description }
    )
  )
}

export async function createOrganization(name: string): Promise<ActionResult> {
  return actionResult(
    await whitePlateApi.post("/api/v1/organizations", { name })
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
