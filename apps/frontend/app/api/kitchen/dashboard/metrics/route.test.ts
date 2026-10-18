import { beforeEach, expect, it, vi } from "vitest"
import { GET } from "./route"
import {
  getDashboardMetrics,
  getRestaurantMemberships,
} from "@/services/orders"

vi.mock("@/services/orders", () => ({
  getDashboardMetrics: vi.fn(),
  getRestaurantMemberships: vi.fn(),
}))

const tenantId = "11111111-1111-4111-8111-111111111111"

beforeEach(() => vi.resetAllMocks())

it.each(["tenantId=bad", `tenantId=${tenantId}&tenantId=${tenantId}`])(
  "rejects invalid tenant selectors before data access: %s",
  async (query) => {
    const response = await GET(
      new Request(`http://localhost/api/kitchen/dashboard/metrics?${query}`)
    )

    expect(response.status).toBe(400)
    expect(getRestaurantMemberships).not.toHaveBeenCalled()
    expect(getDashboardMetrics).not.toHaveBeenCalled()
  }
)

it("requires a verified restaurant membership before reading metrics", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: true,
    status: 200,
    data: [],
  })

  const response = await GET(
    new Request(
      `http://localhost/api/kitchen/dashboard/metrics?tenantId=${tenantId}`
    )
  )

  expect(response.status).toBe(403)
  expect(getDashboardMetrics).not.toHaveBeenCalled()
})

it("returns validated metrics without caching authenticated responses", async () => {
  vi.mocked(getRestaurantMemberships).mockResolvedValue({
    ok: true,
    status: 200,
    data: [
      {
        id: tenantId,
        name: "Bistro",
        role: "Kitchen",
        permissions: ["kitchen.display"],
      },
    ],
  })
  vi.mocked(getDashboardMetrics).mockResolvedValue({
    ok: true,
    status: 200,
    data: {
      currency: "EUR",
      timeZone: "UTC",
      businessDate: "2026-10-14",
      comparisonDate: "2026-10-13",
      orderCount: 0,
      comparisonOrderCount: 0,
      orderValue: null,
      comparisonOrderValue: null,
      activeOrders: { total: 0, pending: 0, preparing: 0, ready: 0 },
      hourlyOrders: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        current: 0,
        previous: 0,
      })),
      topSellingItems: [],
      averagePreparationMinutes: null,
      preparationSampleCount: 0,
    },
  })

  const request = new Request(
    `http://localhost/api/kitchen/dashboard/metrics?tenantId=${tenantId}`
  )

  const response = await GET(request)

  expect(getDashboardMetrics).toHaveBeenCalledWith(tenantId, request.signal)
  expect(response.headers.get("Cache-Control")).toBe("private, no-store")
  expect(await response.json()).toMatchObject({
    ok: true,
    data: { orderCount: 0, averagePreparationMinutes: null },
  })
})
