import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getRestaurantMemberships: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}))
vi.mock("./orders", () => ({
  getRestaurantMemberships: mocks.getRestaurantMemberships,
}))
vi.mock("next-intl/server", () => ({ getLocale: async () => "fr" }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("next/navigation", () => ({
  redirect: (href: string) => {
    throw new Error(href)
  },
}))
import { getManagedWorkspaceRestaurant } from "./live-workspace"

const id = "22222222-2222-4222-8222-222222222222"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getSession.mockResolvedValue({ user: { emailVerified: true } })
  mocks.getRestaurantMemberships.mockResolvedValue({
    ok: true,
    data: [{ id, name: "Real", role: "Manager" }],
  })
})
it("rejects anonymous and unverified users before accessing API data", async () => {
  mocks.getSession.mockResolvedValue(null)
  await expect(getManagedWorkspaceRestaurant(id)).rejects.toThrow("/fr/sign-in")
  expect(mocks.getRestaurantMemberships).not.toHaveBeenCalled()
  mocks.getSession.mockResolvedValue({ user: { emailVerified: false } })
  await expect(getManagedWorkspaceRestaurant(id)).rejects.toThrow(
    "/fr/verify-email"
  )
})
it("does not use unknown, repeated or kitchen tenant selections as management access", async () => {
  expect(await getManagedWorkspaceRestaurant([id, id])).toBeNull()
  expect(mocks.getRestaurantMemberships).not.toHaveBeenCalled()
  expect(
    await getManagedWorkspaceRestaurant("11111111-1111-4111-8111-111111111111")
  ).toBeNull()
  mocks.getRestaurantMemberships.mockResolvedValue({
    ok: true,
    data: [{ id, role: "Kitchen" }],
  })
  expect(await getManagedWorkspaceRestaurant(id)).toBeNull()
})
it("returns only authorized API membership data and never substitutes fixtures on failure", async () => {
  expect(await getManagedWorkspaceRestaurant(id)).toEqual({
    id,
    name: "Real",
    role: "Manager",
  })
  mocks.getRestaurantMemberships.mockResolvedValue({ ok: false, status: 503 })
  expect(await getManagedWorkspaceRestaurant(id)).toBeNull()
})
