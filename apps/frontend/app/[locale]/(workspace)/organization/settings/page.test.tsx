import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import OrganizationSettingsPage from "./page"

const { getSession, getOrganizations } = vi.hoisted(() => ({
  getSession: vi.fn(),
  getOrganizations: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }))
vi.mock("@/actions/organization", () => ({
  renameOrganizationAction: vi.fn(),
}))
vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))

vi.mock("@/services/organization-queries", () => ({
  getOrganizations,
}))

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react")

  return {
    Link: ({ href, children, ...props }: Record<string, unknown>) =>
      React.createElement("a", { href, ...props }, children as React.ReactNode),
    useRouter: () => ({ refresh: vi.fn() }),
  }
})

vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("next-intl/server", () => ({
  getLocale: async () => "en",
  getTranslations: async () => (key: string) =>
    ({
      title: "Organization settings",
      description: "Update your organization details.",
      name: "Organization name",
      save: "Save organization name",
      saving: "Saving…",
      updated: "Organization name updated.",
      backToOrganizations: "All organizations",
      notFoundTitle: "Organization unavailable",
      notFound: "This organization is unavailable to your account.",
      serviceError: "Try again later.",
      "errors.invalid": "Check the organization name and your access.",
      "errors.unavailable": "Try again later.",
      "errors.unauthorized": "Sign in again.",
    })[key] ?? key,
}))
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) =>
    ({
      name: "Organization name",
      save: "Save organization name",
      saving: "Saving…",
      updated: "Organization name updated.",
      "errors.invalid": "Check the organization name and your access.",
      "errors.unavailable": "Try again later.",
      "errors.unauthorized": "Sign in again.",
    })[key] ?? key,
}))

const organizationId = "11111111-1111-4111-8111-111111111111"

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { emailVerified: true } })
  getOrganizations.mockResolvedValue({
    ok: true,
    status: 200,
    data: [{ id: organizationId, name: "White Plate Group", isActive: true }],
  })
})

it("renders settings only for an organization in the owner list", async () => {
  const page = await OrganizationSettingsPage({
    searchParams: Promise.resolve({ organizationId }),
  })
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain("Organization settings")
  expect(html).toContain('value="White Plate Group"')
  expect(html).toContain(`value="${organizationId}"`)
})

it("does not render a rename form for a foreign organization", async () => {
  getOrganizations.mockResolvedValue({
    ok: true,
    status: 200,
    data: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Other",
        isActive: true,
      },
    ],
  })

  const page = await OrganizationSettingsPage({
    searchParams: Promise.resolve({ organizationId }),
  })
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain("This organization is unavailable to your account.")
  expect(html).not.toContain('name="organizationId"')
})

it("shows a safe error when the organization response has no data", async () => {
  getOrganizations.mockResolvedValue({
    ok: true,
    status: 200,
    data: null,
  })

  const page = await OrganizationSettingsPage({
    searchParams: Promise.resolve({ organizationId }),
  })
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain("Try again later.")
  expect(html).not.toContain('name="organizationId"')
})

it("rejects repeated organization selectors before reading organizations", async () => {
  const page = await OrganizationSettingsPage({
    searchParams: Promise.resolve({
      organizationId: [organizationId, organizationId],
    }),
  })
  const html = renderToStaticMarkup(createElement(() => page))

  expect(html).toContain("This organization is unavailable to your account.")
  expect(getOrganizations).not.toHaveBeenCalled()
})
