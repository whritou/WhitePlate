"use server"

import { escapeEmailHtml } from "@/lib/email"
import { whitePlateApi } from "@/lib/api"

type ActionErrorMessage = "unauthorized" | "invalid" | "unavailable"
type ActionResult = { ok: true } | { ok: false; message: ActionErrorMessage }

export async function updateMenuLanguagesAction(input: {
  tenantId: string
  locales: string[]
  defaultLocale: string
}): Promise<ActionResult> {
  const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
  if (!input || typeof input !== "object" || typeof input.tenantId !== "string" ||
    typeof input.defaultLocale !== "string" || !validUuid.test(input.tenantId) ||
    !Array.isArray(input.locales) || input.locales.length === 0 ||
    input.locales.some((locale) => typeof locale !== "string" || locale.length > 255) ||
    !input.locales.includes(input.defaultLocale)) return { ok: false, message: "invalid" }

  const response = await whitePlateApi.put<void, { locales: string[]; defaultLocale: string }>(
    `/api/v1/tenants/${input.tenantId}/menu-languages`,
    { locales: input.locales, defaultLocale: input.defaultLocale },
  )
  return response.ok ? { ok: true } : { ok: false, message: toActionMessage(response.error) }
}

export async function saveCatalogTranslationAction(input: {
  tenantId: string
  entityType: "categories" | "products" | "option-groups" | "options"
  entityId: string
  locale: string
  name: string
  description: string | null
}): Promise<ActionResult> {
  const validUuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i
  const validTypes = ["categories", "products", "option-groups", "options"]
  if (!input || typeof input !== "object" || typeof input.tenantId !== "string" ||
    typeof input.entityId !== "string" || !validUuid.test(input.tenantId) || !validUuid.test(input.entityId) ||
    !validTypes.includes(input.entityType) || typeof input.locale !== "string" || input.locale.length > 255 ||
    typeof input.name !== "string" || input.name.trim().length === 0 || input.name.length > 160 ||
    (input.description !== null && (typeof input.description !== "string" || input.description.length > 1000))) {
    return { ok: false, message: "invalid" }
  }
  const response = await whitePlateApi.put<void, { locale: string; name: string; description: string | null }>(
    `/api/v1/tenants/${input.tenantId}/catalog/${input.entityType}/${input.entityId}/translation`,
    { locale: input.locale, name: input.name, description: input.description },
  )
  return response.ok ? { ok: true } : { ok: false, message: toActionMessage(response.error) }
}

export async function createOrganizationAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim()
  if (!name || name.length > 200) return { ok: false, message: "invalid" }
  const response = await whitePlateApi.post<void, { name: string }>("/api/v1/organizations", { name })
  return response.ok ? { ok: true } : { ok: false, message: toActionMessage(response.error) }
}

export async function sendStaffInvitationAction(formData: FormData): Promise<ActionResult> {
  const organizationId = String(formData.get("organizationId") ?? "")
  const tenantId = String(formData.get("tenantId") ?? "") || null
  const email = String(formData.get("email") ?? "").trim()
  const role = String(formData.get("role") ?? "")
  const locale = formData.get("locale") === "fr" ? "fr" : "en"
  const validUuid = (value: string) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const roleValid = ["OrganizationOwner", "RestaurantManager", "KitchenStaff"].includes(role) &&
    (role === "OrganizationOwner" ? !tenantId : Boolean(tenantId))
  if (!validUuid(organizationId) || (tenantId && !validUuid(tenantId)) ||
    !emailValid || email.length > 254 || !roleValid) {
    return { ok: false, message: "invalid" }
  }

  const response = await whitePlateApi.post<{ id?: string; token?: string }, { tenantId: string | null; email: string; role: string }>(
    `/api/v1/organizations/${organizationId}/invitations`,
    { tenantId, email, role },
  )
  if (!response.ok) return { ok: false, message: toActionMessage(response.error) }
  const invitation = response.data
  const invitationId = invitation?.id
  const invitationToken = invitation?.token
  if (!invitationId || !validUuid(invitationId) || !invitationToken || !/^[a-f0-9]{64}$/i.test(invitationToken)) {
    if (invitationId && validUuid(invitationId)) {
      await whitePlateApi.delete<void>(`/api/v1/organizations/${organizationId}/invitations/${invitationId}`)
    }
    return { ok: false, message: "unavailable" }
  }

  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  const authUrl = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  if (!resendKey || !from) {
    await whitePlateApi.delete<void>(`/api/v1/organizations/${organizationId}/invitations/${invitationId}`)
    return { ok: false, message: "unavailable" }
  }

  let inviteUrl: URL
  try {
    const baseUrl = new URL(authUrl)
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") throw new Error("invalid_auth_url")
    inviteUrl = new URL(`/${locale}/invitations/accept`, baseUrl)
  } catch {
    await whitePlateApi.delete<void>(`/api/v1/organizations/${organizationId}/invitations/${invitation.id}`)
    return { ok: false, message: "unavailable" }
  }
  inviteUrl.searchParams.set("token", invitationToken)
  const french = locale === "fr"
  const copy = french
    ? { subject: "Invitation à rejoindre une équipe WhitePlate", title: "Vous avez reçu une invitation", action: "Accepter l’invitation", text: "Ce lien est valable pendant sept jours." }
    : { subject: "You’re invited to a WhitePlate team", title: "You have a team invitation", action: "Accept invitation", text: "This link expires in seven days." }
  const escapedUrl = escapeEmailHtml(inviteUrl.toString())
  const body = {
    from,
    to: email,
    subject: copy.subject,
    html: `<main style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;color:#24231f"><h1>${copy.title}</h1><p><a href="${escapedUrl}" style="display:inline-block;padding:12px 18px;background:#a94b25;color:#fff;text-decoration:none">${copy.action}</a></p><p>${copy.text}</p></main>`,
    text: `${copy.title}\n\n${inviteUrl}\n\n${copy.text}`,
  }
  const delivery = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  }).catch(() => null)
  if (!delivery?.ok) {
    await whitePlateApi.delete<void>(`/api/v1/organizations/${organizationId}/invitations/${invitationId}`)
    return { ok: false, message: "unavailable" }
  }
  return { ok: true }
}

export async function acceptStaffInvitationAction(invitationToken: string): Promise<ActionResult> {
  if (!/^[a-f0-9]{64}$/i.test(invitationToken)) return { ok: false, message: "invalid" }
  const response = await whitePlateApi.post<void, { token: string }>("/api/v1/invitations/accept", { token: invitationToken })
  return response.ok ? { ok: true } : { ok: false, message: toActionMessage(response.error) }
}

function toActionMessage(error: "unauthorized" | "forbidden" | "invalid" | "not_found" | "conflict" | "unavailable"): ActionErrorMessage {
  if (error === "unauthorized") return "unauthorized"
  if (error === "invalid" || error === "not_found" || error === "conflict") return "invalid"
  return "unavailable"
}
