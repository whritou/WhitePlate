import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, it, vi } from "vitest"
import TeamPage from "./page"

const {
  getLocale,
  getTranslations,
  getOrganizations,
  getOrganizationRestaurants,
  getOrganizationMembers,
  getOrganizationInvitations,
} = vi.hoisted(() => ({
  getLocale: vi.fn(),
  getTranslations: vi.fn(),
  getOrganizations: vi.fn(),
  getOrganizationRestaurants: vi.fn(),
  getOrganizationMembers: vi.fn(),
  getOrganizationInvitations: vi.fn(),
}))

vi.mock("next-intl/server", () => ({ getLocale, getTranslations }))
vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({ redirect: vi.fn() }))
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, ...props }: Record<string, unknown>) =>
    createElement("a", { href, ...props }, children as never),
  useRouter: () => ({ refresh: vi.fn() }),
}))
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: { email?: string }) =>
    values?.email ? `${key}:${values.email}` : key,
}))
vi.mock("@/components/ui/toast", () => ({
  useWorkspaceToast: () => ({ success: vi.fn() }),
}))
vi.mock("@/lib/auth", () => ({
  auth: {
    api: { getSession: async () => ({ user: { emailVerified: true } }) },
  },
}))
vi.mock("@/services/organization-queries", () => ({
  getOrganizations,
  getOrganizationRestaurants,
  getOrganizationMembers,
  getOrganizationInvitations,
}))
vi.mock("@/components/auth/staff-invitation-form", () => ({
  StaffInvitationForm: () => createElement("form", null, "Invitation form"),
}))

const organizationId = "11111111-1111-4111-8111-111111111111"
const tenantId = "22222222-2222-4222-8222-222222222222"
const invitationId = "33333333-3333-4333-8333-333333333333"
const acceptedInvitationId = "44444444-4444-4444-8444-444444444444"
const revokedInvitationId = "55555555-5555-4555-8555-555555555555"
const expiredInvitationId = "66666666-6666-4666-8666-666666666666"

beforeEach(() => {
  vi.clearAllMocks()
  getLocale.mockResolvedValue("en")
  getTranslations.mockImplementation(async () => (key: string) => key)
  getOrganizations.mockResolvedValue({
    ok: true,
    data: [{ id: organizationId, name: "White Plate Group" }],
  })
  getOrganizationRestaurants.mockResolvedValue({
    ok: true,
    data: [
      { id: tenantId, name: "Bistro", subdomain: "bistro", currency: "EUR" },
    ],
  })
  getOrganizationMembers.mockResolvedValue({
    ok: true,
    data: [
      {
        role: "OrganizationOwner",
        email: "owner@example.test",
        tenantId: null,
        tenantName: null,
      },
      {
        role: "KitchenStaff",
        email: "chef@example.test",
        tenantId,
        tenantName: "Bistro",
      },
    ],
  })
  getOrganizationInvitations.mockResolvedValue({
    ok: true,
    data: [
      {
        id: invitationId,
        role: "KitchenStaff",
        email: "pending@example.test",
        tenantId,
        tenantName: "Bistro",
        expiresAt: "2026-10-13T12:00:00Z",
        status: "Pending",
      },
      {
        id: acceptedInvitationId,
        role: "KitchenStaff",
        email: "accepted@example.test",
        tenantId,
        tenantName: "Bistro",
        expiresAt: "2026-10-13T12:00:00Z",
        status: "Accepted",
      },
      {
        id: revokedInvitationId,
        role: "KitchenStaff",
        email: "revoked@example.test",
        tenantId,
        tenantName: "Bistro",
        expiresAt: "2026-10-13T12:00:00Z",
        status: "Revoked",
      },
      {
        id: expiredInvitationId,
        role: "KitchenStaff",
        email: "expired@example.test",
        tenantId,
        tenantName: "Bistro",
        expiresAt: "2026-10-13T12:00:00Z",
        status: "Expired",
      },
    ],
  })
})

it("renders the organization roster and invitation status beside the invitation form", async () => {
  const page = await TeamPage({
    searchParams: Promise.resolve({ organizationId }),
  })
  const html = renderToStaticMarkup(createElement(() => page))

  expect(getOrganizationMembers).toHaveBeenCalledWith(organizationId)
  expect(getOrganizationInvitations).toHaveBeenCalledWith(organizationId)
  expect(html).toContain("teamRosterTitle")
  expect(html).toContain("owner@example.test")
  expect(html).toContain("chef@example.test")
  expect(html).toContain("teamInvitationsTitle")
  expect(html).toContain("pending@example.test")
  expect(html).toContain("accepted@example.test")
  expect(html).toContain("revoked@example.test")
  expect(html).toContain("expired@example.test")
  expect(html).toContain("invitationStatus.Pending")
  expect(html).toContain(
    'aria-label="revokeInvitationFor:pending@example.test"'
  )
  expect(html).toContain("revokeInvitationAction")
  expect(html.match(/revokeInvitationAction/g)).toHaveLength(1)
  expect(html).toContain("Invitation form")
})
