import { afterEach, expect, it, vi } from "vitest"
import {
  fetchOrderPage,
  fetchDashboardMetrics,
  getSignalRToken,
  OrderRequestError,
  fetchPublicOrderTracking,
} from "./order-browser"

afterEach(() => vi.unstubAllGlobals())

it("loads restaurant-scoped metrics through the same-origin BFF", async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      ok: true,
      data: {
        currency: "EUR",
        timeZone: "Europe/Paris",
        businessDate: "2026-10-14",
        comparisonDate: "2026-10-13",
        orderCount: 1,
        comparisonOrderCount: 0,
        orderValue: null,
        comparisonOrderValue: null,
        activeOrders: { total: 1, pending: 1, preparing: 0, ready: 0 },
        hourlyOrders: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          current: hour === 12 ? 1 : 0,
          previous: 0,
        })),
        topSellingItems: [],
        averagePreparationMinutes: null,
        preparationSampleCount: 0,
      },
    })
  )

  vi.stubGlobal("fetch", fetch)

  const signal = new AbortController().signal
  const tenantId = "11111111-1111-4111-8111-111111111111"

  const metrics = await fetchDashboardMetrics(tenantId, signal)

  expect(metrics.orderCount).toBe(1)
  expect(metrics.orderValue).toBeNull()
  expect(fetch).toHaveBeenCalledWith(
    `/api/kitchen/dashboard/metrics?tenantId=${tenantId}`,
    expect.objectContaining({
      signal,
      credentials: "same-origin",
      cache: "no-store",
    })
  )
})

it("requests a fresh SignalR token through the protected same-origin POST adapter", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ accessToken: "test-token" }))

  vi.stubGlobal("fetch", fetch)
  expect(await getSignalRToken()).toBe("test-token")
  expect(fetch).toHaveBeenCalledWith(
    "/api/kitchen/signalr-token",
    expect.objectContaining({
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    })
  )
})

it.each([null, { accessToken: "" }, { accessToken: 123 }])(
  "rejects malformed SignalR credentials: %j",
  async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(body)))
    await expect(getSignalRToken()).rejects.toThrow(
      "SignalR authentication is unavailable."
    )
  }
)

it("uses the same-origin BFF without a token and forwards cancellation", async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      ok: true,
      data: {
        items: [],
        nextCursor: null,
        serverTime: "2026-10-01T18:00:00Z",
      },
    })
  )

  vi.stubGlobal("fetch", fetch)

  const signal = new AbortController().signal

  expect(await fetchOrderPage("tenant", "Ready", "older", signal)).toEqual({
    items: [],
    nextCursor: null,
    serverTime: "2026-10-01T18:00:00Z",
  })
  expect(fetch).toHaveBeenCalledWith(
    "/api/kitchen/orders?tenantId=tenant&status=Ready&cursor=older",
    expect.objectContaining({
      signal,
      credentials: "same-origin",
      cache: "no-store",
      redirect: "error",
    })
  )

  const headers = new Headers(fetch.mock.calls[0]![1].headers)

  expect(headers.get("Accept")).toBe("application/json")
  expect(headers.get("Authorization")).toBeNull()
})

it.each([
  [401, "unauthorized"],
  [403, "forbidden"],
  [404, "forbidden"],
  [400, "invalid"],
  [500, "unavailable"],
])("maps HTTP %s to a safe query error", async (status, code) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: Number(status) }))
  )
  await expect(
    fetchOrderPage("tenant", null, null, new AbortController().signal)
  ).rejects.toMatchObject({ code })
})

it("rejects malformed order data instead of caching it as a successful page", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({
        ok: true,
        data: { items: [{ id: "not-an-order" }], nextCursor: null },
      })
    )
  )
  await expect(
    fetchOrderPage("tenant", null, null, new AbortController().signal)
  ).rejects.toEqual(new OrderRequestError("unavailable"))
})

it("retains the preview slug in capability tracking requests", async () => {
  const orderId = "33333333-3333-4333-8333-333333333333"
  const token = "A".repeat(43)
  const signal = new AbortController().signal
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      id: orderId,
      status: "Ready",
      version: 2,
      createdAt: "2026-10-14T12:00:00Z",
    })
  )

  vi.stubGlobal("fetch", fetch)

  await fetchPublicOrderTracking(orderId, token, signal, "bistro")

  expect(fetch).toHaveBeenCalledWith(
    `/api/public/orders/${orderId}/tracking?restaurantSlug=bistro`,
    expect.objectContaining({ method: "POST", signal })
  )
})
