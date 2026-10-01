import { beforeEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import { getOrderPage, getRestaurantMemberships } from "@/services/orders"

vi.mock("@/services/orders", () => ({
  getOrderPage: vi.fn(),
  getRestaurantMemberships: vi.fn(),
}))

const tenantId = "11111111-1111-4111-8111-111111111111"

beforeEach(() => vi.resetAllMocks())

it.each([
  "tenantId=bad",
  `tenantId=${tenantId}&status=Unknown`,
  `tenantId=${tenantId}&cursor=a/b`,
  `tenantId=${tenantId}&tenantId=${tenantId}`,
])("rejects invalid query input before data access: %s", async (query) => {
  const response = await GET(
    new Request(`http://localhost/api/kitchen/orders?${query}`)
  )

  expect(response.status).toBe(400)
  expect(getRestaurantMemberships).not.toHaveBeenCalled()
  expect(getOrderPage).not.toHaveBeenCalled()
})

it("requires authentication on the read endpoint", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: false,
    status: 401,
    error: "unauthorized",
  })

  const response = await GET(
    new Request(`http://localhost/api/kitchen/orders?tenantId=${tenantId}`)
  )

  expect(response.status).toBe(401)
  expect(getOrderPage).not.toHaveBeenCalled()
})

it("never reads orders when the selector is outside the user's memberships", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: true,
    status: 200,
    data: [],
  })

  const response = await GET(
    new Request(`http://localhost/api/kitchen/orders?tenantId=${tenantId}`)
  )

  expect(response.status).toBe(403)
  expect(getOrderPage).not.toHaveBeenCalled()
})

it("returns validated pages without caching authenticated responses", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: true,
    status: 200,
    data: [{ id: tenantId, name: "Bistro", role: "Kitchen" }],
  })
  vi.mocked(getOrderPage).mockResolvedValue({
    ok: true,
    status: 200,
    data: { items: [], nextCursor: null },
  })

  const request = new Request(
    `http://localhost/api/kitchen/orders?tenantId=${tenantId}&status=Ready&cursor=older`
  )
  const response = await GET(request)

  expect(getOrderPage).toHaveBeenCalledWith(
    tenantId,
    "Ready",
    "older",
    request.signal
  )
  expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  expect(await response.json()).toMatchObject({ ok: true, data: { items: [] } })
})
