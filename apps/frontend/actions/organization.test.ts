import { afterEach, expect, it, vi } from "vitest"
import { sendInvitationEmail } from "@/lib/email"
import {
  updateMenuLanguagesAction,
  saveCatalogTranslationAction,
  createOrganizationAction,
  sendStaffInvitationAction,
  acceptStaffInvitationAction,
} from "./organization"
import { whitePlateApi } from "@/lib/api"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/api", () => ({
  whitePlateApi: { post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock("@/lib/email", () => ({ sendInvitationEmail: vi.fn() }))
afterEach(() => vi.resetAllMocks())

const id = "11111111-1111-4111-8111-111111111111"

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
