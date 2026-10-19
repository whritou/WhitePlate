import { expect, it } from "vitest"
import { parsePublicOrderTracking } from "./public-order-tracking"

const id = "11111111-1111-4111-8111-111111111111"
const summary = {
  currency: "EUR",
  subtotal: 12,
  discountAmount: 0,
  taxAmount: 1.2,
  total: 13.2,
  customerEmail: "private@example.test",
  customerPhone: "+33123456789",
  orderNotes: "Private instructions",
  lines: [
    {
      productId: "22222222-2222-4222-8222-222222222222",
      productName: "Soup",
      quantity: 2,
      subtotal: 12,
      total: 13.2,
      options: [],
    },
  ],
}
const order = {
  id,
  status: "Preparing",
  version: 2,
  createdAt: "2026-10-18T10:00:00Z",
  summary,
}

it("forwards capability-protected snapshots without personal fields", () => {
  const parsed = parsePublicOrderTracking(order, id)

  expect(parsed?.summary).toMatchObject({
    currency: "EUR",
    total: 13.2,
    lines: [{ productName: "Soup", quantity: 2 }],
  })
  expect(parsed?.summary).not.toHaveProperty("customerEmail")
  expect(parsed?.summary).not.toHaveProperty("customerPhone")
  expect(parsed?.summary).not.toHaveProperty("orderNotes")
})

it.each([-1, Infinity, NaN])("rejects invalid tracking amounts %s", (total) => {
  expect(
    parsePublicOrderTracking({ ...order, summary: { ...summary, total } }, id)
  ).toBeNull()
})

it("accepts a legacy status-only response without inventing a summary", () => {
  expect(
    parsePublicOrderTracking({ ...order, summary: undefined }, id)
  ).not.toHaveProperty("summary")
})
