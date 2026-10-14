import { beforeEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import { getOrderingOperations } from "@/services/ordering-operations"
import { getRestaurantMemberships } from "@/services/orders"

vi.mock("@/services/ordering-operations", () => ({
  getOrderingOperations: vi.fn(),
}))

vi.mock("@/services/orders", () => ({
  getRestaurantMemberships: vi.fn(),
}))

const tenantId = "11111111-1111-4111-8111-111111111111"

beforeEach(() => vi.resetAllMocks())

it.each(["tenantId=bad", `tenantId=${tenantId}&tenantId=${tenantId}`])(
  "rejects invalid tenant selectors before reading operations: %s",
  async (query) => {
    const response = await GET(
      new Request(
        `http://localhost/api/kitchen/dashboard/ordering-operations?${query}`
      )
    )

    expect(response.status).toBe(400)
    expect(getRestaurantMemberships).not.toHaveBeenCalled()
    expect(getOrderingOperations).not.toHaveBeenCalled()
  }
)

it("requires a current restaurant membership before reading operations", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: true,
    status: 200,
    data: [],
  })

  const response = await GET(
    new Request(
      `http://localhost/api/kitchen/dashboard/ordering-operations?tenantId=${tenantId}`
    )
  )

  expect(response.status).toBe(403)
  expect(getOrderingOperations).not.toHaveBeenCalled()
})

it("returns current state with authenticated no-store headers", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: true,
    status: 200,
    data: [{ id: tenantId, name: "Bistro", role: "Kitchen" }],
  })
  vi.mocked(getOrderingOperations).mockResolvedValue({
    ok: true,
    status: 200,
    data: {
      acceptingOrders: false,
      rushHoldEnabled: true,
      rushBufferMinutes: 10,
      version: 2,
    },
  })

  const request = new Request(
    `http://localhost/api/kitchen/dashboard/ordering-operations?tenantId=${tenantId}`
  )
  const response = await GET(request)

  expect(getOrderingOperations).toHaveBeenCalledWith(tenantId, request.signal)
  expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  expect(response.headers.get("Vary")).toBe("Cookie")
  expect(await response.json()).toMatchObject({
    ok: true,
    data: { acceptingOrders: false, rushBufferMinutes: 10 },
  })
})
