import { describe, expect, it } from "vitest"
import {
  prepareCheckout,
  updateCart,
  validateOrderInput,
  validProductSelection,
} from "./cart"

const productId = "11111111-1111-4111-8111-111111111111"
const optionId = "22222222-2222-4222-8222-222222222222"
const input = {
  customerName: " Alice ",
  discountCode: " lunch ",
  items: [{ productId, quantity: 2, optionIds: [optionId] }],
}

describe("guest cart", () => {
  it("does not send client prices, tenant IDs, or unknown fields in an order", () => {
    const forged = {
      ...input,
      tenantId: optionId,
      total: 0,
      items: [{ ...input.items[0], price: 0 }],
    }
    expect(prepareCheckout(forged, null, () => "key").input).toEqual({
      customerName: "Alice",
      discountCode: "LUNCH",
      items: [{ productId, quantity: 2, optionIds: [optionId] }],
    })
  })
  it("enforces required options, maximum selections, and current availability", () => {
    const product = {
      isAvailable: true,
      optionGroups: [
        {
          minimumSelections: 1,
          maximumSelections: 1,
          options: [{ id: optionId }, { id: productId }],
        },
      ],
    }
    expect(validProductSelection(product, [optionId])).toBe(true)
    expect(validProductSelection(product, [])).toBe(false)
    expect(validProductSelection(product, [optionId, productId])).toBe(false)
    expect(
      validProductSelection({ ...product, isAvailable: false }, [optionId])
    ).toBe(false)
    expect(validProductSelection(product, ["missing-option"])).toBe(false)
  })
  it("keeps one editable line per product as required by checkout", () => {
    const cart = updateCart([], { productId, quantity: 1, optionIds: [] })
    expect(
      updateCart(cart, { productId, quantity: 3, optionIds: [optionId] })
    ).toEqual([{ productId, quantity: 3, optionIds: [optionId] }])
  })

  it("removes a product when its quantity is zero without changing other lines", () => {
    const other = { productId: optionId, quantity: 1, optionIds: [] }
    expect(
      updateCart([input.items[0], other], {
        productId,
        quantity: 0,
        optionIds: [],
      })
    ).toEqual([other])
  })

  it("reuses the same payload and key for an unchanged retry", () => {
    const first = prepareCheckout(input, null, () => "first-key")
    const retry = prepareCheckout(
      { ...input, customerName: "Alice", discountCode: "LUNCH" },
      first,
      () => "wrong-key"
    )
    expect(retry.key).toBe("first-key")
    expect(retry.input).toEqual({
      ...input,
      customerName: "Alice",
      discountCode: "LUNCH",
    })
  })

  it("starts a new attempt after the order content changes", () => {
    const first = prepareCheckout(input, null, () => "first-key")
    expect(
      prepareCheckout(
        { ...input, items: [{ productId, quantity: 3, optionIds: [] }] },
        first,
        () => "next-key"
      ).key
    ).toBe("next-key")
  })

  it("copies the attempt so later cart edits cannot change an uncertain order", () => {
    const editable = structuredClone(input)
    const first = prepareCheckout(editable, null, () => "first-key")
    editable.items[0].quantity = 9
    expect(first.input.items[0].quantity).toBe(2)
  })

  it("accepts a valid bounded order", () => {
    expect(validateOrderInput(input)).toBe(true)
  })

  it.each([
    null,
    { ...input, customerName: " " },
    { ...input, customerName: "a".repeat(201) },
    { ...input, items: [] },
    { ...input, items: [input.items[0], input.items[0]] },
    { ...input, items: [{ productId, quantity: 100, optionIds: [] }] },
    { ...input, items: [{ productId, quantity: 1.5, optionIds: [] }] },
    {
      ...input,
      items: [{ productId: "https://other.test", quantity: 1, optionIds: [] }],
    },
    {
      ...input,
      items: [{ productId, quantity: 1, optionIds: [optionId, optionId] }],
    },
  ])("rejects malformed or out-of-contract orders %#", (value) => {
    expect(validateOrderInput(value)).toBe(false)
  })
})
