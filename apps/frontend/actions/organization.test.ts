import { afterEach, expect, it, vi } from "vitest"
import { sendInvitationEmail } from "@/lib/email"
import {
  updateMenuLanguagesAction,
  saveCatalogTranslationAction,
  createOrganizationAction,
  renameOrganizationAction,
  sendStaffInvitationAction,
  acceptStaffInvitationAction,
  saveRestaurantDescriptionTranslationAction,
  decideCatalogTranslationAction,
  saveCatalogTranslationGlossaryAction,
  deleteCatalogTranslationGlossaryAction,
} from "./organization"
import { whitePlateApi } from "@/lib/api"
import * as organizationActions from "./organization"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api", () => ({
  whitePlateApi: {
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))
vi.mock("@/lib/email", () => ({ sendInvitationEmail: vi.fn() }))
afterEach(() => vi.resetAllMocks())

const id = "11111111-1111-4111-8111-111111111111"

it("revokes only a well-formed organization invitation through the API", async () => {
  const revoke = (
    organizationActions as unknown as Record<
      string,
      (input: unknown) => Promise<unknown>
    >
  ).revokeStaffInvitationAction

  vi.mocked(whitePlateApi.delete).mockResolvedValue({
    ok: true,
    status: 204,
    data: undefined,
  })

  expect(await revoke({ organizationId: id, invitationId: id })).toEqual({
    ok: true,
  })
  expect(whitePlateApi.delete).toHaveBeenCalledWith(
    `/api/v1/organizations/${id}/invitations/${id}`
  )
  expect(await revoke({ organizationId: "../me", invitationId: id })).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(whitePlateApi.delete).toHaveBeenCalledTimes(1)
})

it.each([
  null,
  [],
  "not a record",
  { tenantId: id, locales: ["fr"], defaultLocale: "en" },
])("rejects malformed menu settings without a request: %o", async (input) => {
  expect(await updateMenuLanguagesAction(input)).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(whitePlateApi.put).not.toHaveBeenCalled()
})

it("does not coerce an attacker-controlled invitation token into a valid string", async () => {
  expect(
    await acceptStaffInvitationAction({ toString: () => "a".repeat(64) })
  ).toEqual({ ok: false, message: "invalid" })
  expect(whitePlateApi.post).not.toHaveBeenCalled()
})

it("rejects file form fields and oversized non-product translation names", async () => {
  const form = new FormData()

  form.set("name", new Blob(["organization"]), "name.txt")
  expect(await createOrganizationAction(form)).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(
    await saveCatalogTranslationAction({
      tenantId: id,
      entityId: id,
      entityType: "categories",
      locale: "fr",
      name: "a".repeat(121),
      description: null,
    })
  ).toEqual({ ok: false, message: "invalid" })
  expect(whitePlateApi.post).not.toHaveBeenCalled()
  expect(whitePlateApi.put).not.toHaveBeenCalled()
})

it("reports that changed menu text is submitted for human review instead of saved immediately", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: { unchanged: false, reviewId: id, version: 1, status: "Pending" },
  })

  expect(
    await saveCatalogTranslationAction({
      tenantId: id,
      entityId: id,
      entityType: "products",
      locale: "fr",
      name: "Soupe",
      description: "Soupe fraîche",
    })
  ).toEqual({ ok: true, unchanged: false, status: "Pending" })
})

it("saves only valid restaurant description translations through the API", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 204,
    data: undefined,
  })

  expect(
    await saveRestaurantDescriptionTranslationAction({
      tenantId: id,
      locale: "fr",
      description: "  Bienvenue  ",
    })
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${id}/restaurant-description-translations/fr`,
    { description: "  Bienvenue  " }
  )
  expect(
    await saveRestaurantDescriptionTranslationAction({
      tenantId: id,
      locale: "fr",
      description: "a".repeat(501),
    })
  ).toEqual({ ok: false, message: "invalid" })
  expect(whitePlateApi.put).toHaveBeenCalledTimes(1)
})

it("decides a versioned catalog translation review and rejects an invalid version", async () => {
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 204,
    data: undefined,
  })

  expect(
    await decideCatalogTranslationAction({
      tenantId: id,
      reviewId: id,
      expectedVersion: 2,
      decision: "approve",
    })
  ).toEqual({ ok: true })
  expect(whitePlateApi.post).toHaveBeenCalledWith(
    `/api/v1/tenants/${id}/catalog/translation-reviews/${id}/approve`,
    { expectedVersion: 2 }
  )
  expect(
    await decideCatalogTranslationAction({
      tenantId: id,
      reviewId: id,
      expectedVersion: 0,
      decision: "reject",
    })
  ).toEqual({ ok: false, message: "invalid" })
  expect(whitePlateApi.post).toHaveBeenCalledTimes(1)
})

it("saves and deletes only valid tenant glossary terms", async () => {
  vi.mocked(whitePlateApi.put).mockResolvedValue({
    ok: true,
    status: 200,
    data: {},
  })
  vi.mocked(whitePlateApi.delete).mockResolvedValue({
    ok: true,
    status: 204,
    data: undefined,
  })

  expect(
    await saveCatalogTranslationGlossaryAction({
      tenantId: id,
      id: null,
      sourceLocale: "en",
      targetLocale: "fr",
      sourceTerm: "  sourdough  ",
      targetTerm: "  levain  ",
    })
  ).toEqual({ ok: true })
  expect(whitePlateApi.put).toHaveBeenCalledWith(
    `/api/v1/tenants/${id}/catalog/translation-glossary`,
    {
      id: null,
      sourceLocale: "en",
      targetLocale: "fr",
      sourceTerm: "  sourdough  ",
      targetTerm: "  levain  ",
    }
  )
  expect(
    await saveCatalogTranslationGlossaryAction({
      tenantId: id,
      id: null,
      sourceLocale: "en",
      targetLocale: "en",
      sourceTerm: "sourdough",
      targetTerm: "levain",
    })
  ).toEqual({ ok: false, message: "invalid" })
  expect(whitePlateApi.put).toHaveBeenCalledTimes(1)
  expect(
    await deleteCatalogTranslationGlossaryAction({ tenantId: id, id })
  ).toEqual({
    ok: true,
  })
  expect(whitePlateApi.delete).toHaveBeenCalledWith(
    `/api/v1/tenants/${id}/catalog/translation-glossary/${id}`
  )
  expect(
    await deleteCatalogTranslationGlossaryAction({
      tenantId: id,
      id: "../other",
    })
  ).toEqual({ ok: false, message: "invalid" })
  expect(whitePlateApi.delete).toHaveBeenCalledTimes(1)
})

it("renames only the selected organization with a normalized name", async () => {
  const form = new FormData()

  form.set("organizationId", id)
  form.set("name", "  White Plate Group  ")
  vi.mocked(whitePlateApi.patch).mockResolvedValue({
    ok: true,
    status: 200,
    data: { id, name: "White Plate Group" },
  })

  expect(await renameOrganizationAction(form)).toEqual({ ok: true })
  expect(whitePlateApi.patch).toHaveBeenCalledWith(
    `/api/v1/organizations/${id}`,
    { name: "White Plate Group" }
  )
})

it("rejects malformed organization rename input before making an API request", async () => {
  const form = new FormData()

  form.set("organizationId", "not-a-uuid")
  form.set("name", "New name")

  expect(await renameOrganizationAction(form)).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(whitePlateApi.patch).not.toHaveBeenCalled()
})

it("revokes a persisted invitation if delivery fails", async () => {
  const form = new FormData()

  for (const [name, value] of Object.entries({
    organizationId: id,
    tenantId: id,
    email: "staff@example.test",
    role: "KitchenStaff",
    locale: "fr",
  }))
    form.set(name, value)
  vi.mocked(whitePlateApi.post).mockResolvedValue({
    ok: true,
    status: 201,
    data: { id, token: "a".repeat(64) },
  })
  vi.mocked(sendInvitationEmail).mockResolvedValue(false)
  expect(await sendStaffInvitationAction(form)).toEqual({
    ok: false,
    message: "unavailable",
  })
  expect(whitePlateApi.delete).toHaveBeenCalledWith(
    `/api/v1/organizations/${id}/invitations/${id}`
  )
})

it("requires restaurant roles to have a restaurant scope", async () => {
  const form = new FormData()

  for (const [name, value] of Object.entries({
    organizationId: id,
    email: "staff@example.test",
    role: "KitchenStaff",
  }))
    form.set(name, value)
  expect(await sendStaffInvitationAction(form)).toEqual({
    ok: false,
    message: "invalid",
  })
  expect(whitePlateApi.post).not.toHaveBeenCalled()
})
