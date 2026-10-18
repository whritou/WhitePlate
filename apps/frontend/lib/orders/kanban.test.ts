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

it("accepts only the next lifecycle stage and permission-authorized cancellation", () => {
  expect(
    resolveOrderDrop(order, [order], "Preparing", false, ["kitchen.display"])
  ).toEqual({
    orderId: order.id,
    version: 4,
    status: "Preparing",
  })
  expect(
    resolveOrderDrop(order, [order], "Ready", false, ["kitchen.display"])
  ).toBeNull()
  expect(
    resolveOrderDrop(order, [order], "Cancelled", false, ["kitchen.display"])
  ).toBeNull()
  expect(
    resolveOrderDrop(order, [order], "Cancelled", false, ["orders.manage"])
      ?.status
  ).toBe("Cancelled")
})

it("rejects a moved, removed or version-changed ticket and pending mutations", () => {
  expect(resolveOrderDrop(order, [], "Preparing", false)).toBeNull()
  expect(
    resolveOrderDrop(order, [{ ...order, version: 5 }], "Preparing", false)
  ).toBeNull()
  expect(
    resolveOrderDrop(
      order,
      [{ ...order, status: "Preparing" }],
      "Preparing",
      false
    )
  ).toBeNull()
  expect(resolveOrderDrop(order, [order], "Preparing", true)).toBeNull()
  expect(resolveOrderDrop(order, [order], "bogus", false)).toBeNull()
  expect(resolveOrderDrop(order, [order], "Pending", false)).toBeNull()
})
