import { describe, expect, it } from "vitest"
import { calculateDemoOrder, createDemoReceipt } from "./demo-order"

const products = [
  { id: "burger", basePrice: 14.5 },
  { id: "fries", basePrice: 5.8 },
  { id: "shake", basePrice: 6.5 },
]
const cart = products.map(({ id }) => ({ productId: id, quantity: 1 }))

describe("illustrative checkout", () => {
  it("applies the direct discount before tax and rounds currency cents", () => {
    expect(calculateDemoOrder(products, cart, "DIRECT10")).toEqual({
      subtotal: 26.8,
      discount: 2.68,
      tax: 1.93,
      total: 26.05,
    })
  })

  it("does not discount an unknown promotion or charge removed items", () => {
    expect(
      calculateDemoOrder(products, [{ productId: "fries", quantity: 2 }], "BAD")
    ).toEqual({
      subtotal: 11.6,
      discount: 0,
      tax: 0.93,
      total: 12.53,
    })
  })

  it("rejects an unknown product and invalid quantities", () => {
    for (const items of [
      [{ productId: "missing", quantity: 1 }],
      [{ productId: "burger", quantity: -1 }],
      [{ productId: "burger", quantity: 100 }],
    ]) {
      expect(() => calculateDemoOrder(products, items, "")).toThrow()
    }
  })

  it("snapshots the submitted cart so later edits cannot change the receipt", () => {
    const items = [{ productId: "burger", quantity: 1 }]
    const receipt = createDemoReceipt(products, items, "", "Ada")

    items[0].quantity = 3

    expect(receipt.customerName).toBe("Ada")
    expect(receipt.items).toEqual([{ productId: "burger", quantity: 1 }])
    expect(receipt.total).toBe(15.66)
  })

  it("rejects an empty order or missing customer name", () => {
    expect(() => createDemoReceipt(products, [], "", "Ada")).toThrow()
    expect(() => createDemoReceipt(products, cart, "", " ")).toThrow()
  })
})
