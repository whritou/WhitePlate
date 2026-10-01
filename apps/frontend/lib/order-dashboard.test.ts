import { expect, it, vi } from "vitest"
import {
  getAvailableOrderTransitions,
  OrderEventTracker,
  parseOrderCursor,
  parseOrderPage,
  parseRestaurantMemberships,
  parseOrderStatusFilter,
  resolveOrderHubUrl,
} from "./order-dashboard"

it("bounds the event tracker after more than 512 different orders", () => {
  // Fail fast on invalid eviction rather than freezing this test's worker.
  const originalDelete = Map.prototype.delete
  const guard = vi.spyOn(Map.prototype, "delete").mockImplementation(function (
    this: Map<unknown, unknown>,
    key: unknown
  ) {
    if (typeof key !== "string") throw new Error("Invalid order eviction key")
    return originalDelete.call(this, key)
  })
  try {
    const orders = Array.from({ length: 513 }, (_, index) => ({
      id: `${String(index).padStart(8, "0")}-1111-4111-8111-111111111111`,
      version: 2,
    }))
    expect(() => new OrderEventTracker("tenant-a", orders)).not.toThrow()
    const tracker = new OrderEventTracker("tenant-a", orders)
    expect(
      tracker.shouldRefresh({
        eventId: "44444444-4444-4444-8444-444444444444",
        tenantId: "tenant-a",
        orderId: orders[512]!.id,
        version: 1,
        eventType: "order.status_changed",
        status: "Preparing",
        occurredAt: "2026-10-01T18:01:00Z",
      })
    ).toBe(false)
  } finally {
    guard.mockRestore()
  }
})

const page = {
  items: [
    {
      id: "22222222-2222-4222-8222-222222222222",
      customerName: "Ada",
      currency: "EUR",
      total: 19.25,
      status: "Pending",
      version: 1,
      createdAt: "2026-10-01T18:00:00Z",
      lines: [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          productName: "Soup",
          quantity: 2,
          options: [
            {
              optionId: "33333333-3333-4333-8333-333333333333",
              name: "Large",
            },
          ],
        },
      ],
    },
  ],
  nextCursor: "opaque-cursor",
}

it("parses server order snapshots and paged cursors", () => {
  expect(parseOrderPage(page)).toEqual(page)
})

it("rejects malformed order snapshots at the API boundary", () => {
  expect(
    parseOrderPage({
      ...page,
      items: [
        { ...page.items[0], lines: [{ productName: "Soup", quantity: "two" }] },
      ],
    })
  ).toBeNull()
  expect(parseOrderPage({ ...page, nextCursor: "not/a/cursor" })).toBeNull()
})

it.each([
  [undefined, { ok: true, status: null }],
  ["all", { ok: true, status: null }],
  ["Preparing", { ok: true, status: "Preparing" }],
  ["Preparing,Ready", { ok: false }],
  ["Unknown", { ok: false }],
])("validates status filter %s", (value, expected) => {
  expect(parseOrderStatusFilter(value)).toEqual(expected)
})

it("accepts only bounded URL-safe opaque order cursors", () => {
  expect(parseOrderCursor(undefined)).toEqual({ ok: true, cursor: null })
  expect(parseOrderCursor("YWJj-_0123")).toEqual({
    ok: true,
    cursor: "YWJj-_0123",
  })
  expect(parseOrderCursor("")).toEqual({ ok: false })
  expect(parseOrderCursor("a/b")).toEqual({ ok: false })
  expect(parseOrderCursor("a".repeat(129))).toEqual({ ok: false })
})

it("builds a browser hub URL and requires HTTPS in production", () => {
  expect(resolveOrderHubUrl("https://api.example.test/api/v1?x=1", true)).toBe(
    "https://api.example.test/hubs/orders"
  )
  expect(resolveOrderHubUrl("http://localhost:5182", false)).toBe(
    "http://localhost:5182/hubs/orders"
  )
  expect(resolveOrderHubUrl("http://api.example.test", true)).toBeNull()
  expect(
    resolveOrderHubUrl("https://user:password@api.example.test", true)
  ).toBeNull()
})

it("allows kitchen staff only forward transitions and manager cancellation", () => {
  expect(getAvailableOrderTransitions("Kitchen", "Pending")).toEqual([
    "Preparing",
  ])
  expect(getAvailableOrderTransitions("Manager", "Pending")).toEqual([
    "Preparing",
    "Cancelled",
  ])
  expect(getAvailableOrderTransitions("OrganizationOwner", "Ready")).toEqual([
    "Completed",
    "Cancelled",
  ])
  expect(getAvailableOrderTransitions("Kitchen", "Completed")).toEqual([])
})

it("refreshes only for new, newer events from the selected tenant", () => {
  const tracker = new OrderEventTracker("tenant-a", parseOrderPage(page)!.items)
  const event = {
    eventId: "44444444-4444-4444-8444-444444444444",
    tenantId: "tenant-a",
    orderId: page.items[0]!.id,
    eventType: "order.status_changed",
    status: "Preparing",
    version: 2,
    occurredAt: "2026-10-01T18:01:00Z",
  }

  expect(tracker.shouldRefresh({ ...event, tenantId: "tenant-b" })).toBe(false)
  expect(tracker.shouldRefresh(event)).toBe(true)
  expect(tracker.shouldRefresh(event)).toBe(false)
  expect(
    tracker.shouldRefresh({
      ...event,
      eventId: "55555555-5555-4555-8555-555555555555",
      version: 1,
    })
  ).toBe(false)
  expect(
    tracker.shouldRefresh({
      ...event,
      eventId: "66666666-6666-4666-8666-666666666666",
      version: 3,
    })
  ).toBe(true)
})

it("validates the restaurant membership response before offering tenant navigation", () => {
  expect(
    parseRestaurantMemberships({
      restaurants: [
        {
          id: "11111111-1111-4111-8111-111111111111",
          name: "Bistro",
          role: "Kitchen",
        },
      ],
    })
  ).toEqual([
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Bistro",
      role: "Kitchen",
    },
  ])
  expect(
    parseRestaurantMemberships({
      restaurants: [{ id: "not-a-guid", name: "Bistro", role: "Kitchen" }],
    })
  ).toBeNull()
})
