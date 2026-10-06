import { expect, it } from "vitest"
import { resolveOrderDrop } from "./kanban"
import type { OrderSummary } from "@/types/orders"

const order: OrderSummary = {
  id: "22222222-2222-4222-8222-222222222222",
  status: "Pending",
  version: 4,
  customerName: "Ada",
  currency: "EUR",
  menuLocale: "en",
  total: 19.25,
  createdAt: "2026-10-01T18:00:00Z",
  lines: [],
}

it("accepts only the next lifecycle stage and role-authorized cancellation", () => {
  expect(
    resolveOrderDrop(order, [order], "Kitchen", "Preparing", false)
  ).toEqual({
    orderId: order.id,
    version: 4,
    status: "Preparing",
  })
  expect(resolveOrderDrop(order, [order], "Kitchen", "Ready", false)).toBeNull()
  expect(
    resolveOrderDrop(order, [order], "Kitchen", "Cancelled", false)
  ).toBeNull()
  expect(
    resolveOrderDrop(order, [order], "Manager", "Cancelled", false)?.status
  ).toBe("Cancelled")
})

it("rejects a moved, removed or version-changed ticket and pending mutations", () => {
  expect(resolveOrderDrop(order, [], "Kitchen", "Preparing", false)).toBeNull()
  expect(
    resolveOrderDrop(
      order,
      [{ ...order, version: 5 }],
      "Kitchen",
      "Preparing",
      false
    )
  ).toBeNull()
  expect(
    resolveOrderDrop(
      order,
      [{ ...order, status: "Preparing" }],
      "Kitchen",
      "Preparing",
      false
    )
  ).toBeNull()
  expect(
    resolveOrderDrop(order, [order], "Kitchen", "Preparing", true)
  ).toBeNull()
  expect(resolveOrderDrop(order, [order], "Kitchen", "bogus", false)).toBeNull()
  expect(
    resolveOrderDrop(order, [order], "Kitchen", "Pending", false)
  ).toBeNull()
})
