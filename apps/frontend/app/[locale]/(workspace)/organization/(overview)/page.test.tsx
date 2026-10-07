import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import OrganizationPage from "./page"

const {
  getLocale,
  getTranslations,
  getOrganizations,
  getRestaurantMemberships,
} = vi.hoisted(() => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
  getOrganizations: vi.fn(),
  getRestaurantMemberships: vi.fn(),
}))

vi.mock("next-intl/server", () => ({ getLocale, getTranslations }))
vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: async () => ({ user: { emailVerified: true } }) },
  },
}))
vi.mock("@/services/organization-queries", () => ({ getOrganizations }))
vi.mock("@/services/orders", () => ({ getRestaurantMemberships }))
vi.mock("@/components/auth/sign-out-button", () => ({
  SignOutButton: () => createElement("button", null, "Sign out"),
}))
vi.mock("@/components/organization/organization-archive-action", () => ({
  OrganizationArchiveAction: () =>
    createElement("button", null, "restoreOrganization"),
}))
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
}))

const organizationId = "11111111-1111-4111-8111-111111111111"
const tenantId = "22222222-2222-4222-8222-222222222222"

beforeEach(() => {
  vi.clearAllMocks()
  getLocale.mockResolvedValue("en")
  getTranslations.mockImplementation(async () => (key: string) => key)
  getOrganizations.mockResolvedValue({
    ok: true,
    data: [{ id: organizationId, name: "White Plate Group", isActive: true }],
  })
  getRestaurantMemberships.mockResolvedValue({
    ok: true,
    data: [
      {
        id: tenantId,
        name: "Bistro",
        role: "OrganizationOwner",
      },
    ],
  })
})

it("groups organization and restaurant menu actions so labels have spacing and can wrap", async () => {
  const page = await OrganizationPage()
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain('role="group" aria-label="organizationActions"')
  expect(html).toContain('role="group" aria-label="restaurantMenuActions"')
  expect(html).toMatch(
    /flex[^\"]*flex-wrap[^\"]*gap-3[^\"]*"[^>]*>[\s\S]*editMenuLanguages[\s\S]*editCatalog/
  )
})

it("shows an archived organization with a restore action instead of operational links", async () => {
  getOrganizations.mockResolvedValue({
    ok: true,
    data: [{ id: organizationId, name: "White Plate Group", isActive: false }],
  })
  getRestaurantMemberships.mockResolvedValue({ ok: true, data: [] })

  const page = await OrganizationPage()
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain("organizationArchived")
  expect(html).toContain("restoreOrganization")
  expect(html).not.toContain(
    `/organization/team?organizationId=${organizationId}`
  )
})
