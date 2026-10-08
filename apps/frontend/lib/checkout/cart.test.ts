import { describe, expect, it } from "vitest"
import {
  createTrackingToken,
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
  menuLocale: "en",
  items: [{ productId, quantity: 2, optionIds: [optionId] }],
}

describe("guest cart", () => {
  it("creates a 256-bit URL-safe order tracking capability", () => {
    expect(createTrackingToken()).toMatch(/^[A-Za-z0-9_-]{43}$/)
  })

  it("keeps a tracking capability across retries and rotates it for changed order content", () => {
    let tokenNumber = 0
    const makeToken = () => `${"A".repeat(42)}${++tokenNumber}`
    const first = prepareCheckout(input, null, () => "first-key", makeToken)
    const retry = prepareCheckout(input, first, () => "wrong-key", makeToken)
    const changed = prepareCheckout(
      { ...input, items: [{ productId, quantity: 3, optionIds: [] }] },
      first,
      () => "second-key",
      makeToken
    )

    expect(retry.input.trackingToken).toBe(`${"A".repeat(42)}1`)
    expect(changed.input.trackingToken).toBe(`${"A".repeat(42)}2`)
  })

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
      menuLocale: "en",
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

  it("includes the selected menu locale in a checkout attempt", () => {
    expect(
      prepareCheckout({ ...input, menuLocale: "fr" }, null, () => "locale-key")
        .input
    ).toEqual({
      customerName: "Alice",
      discountCode: "LUNCH",
      menuLocale: "fr",
      items: [{ productId, quantity: 2, optionIds: [optionId] }],
    })
  })

  it("starts a new attempt when the selected menu locale changes", () => {
    const first = prepareCheckout(
      { ...input, menuLocale: "fr" },
      null,
      () => "french-key"
    )

    expect(
      prepareCheckout(
        { ...input, menuLocale: "en" },
        first,
        () => "english-key"
      ).key
    ).toBe("english-key")
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
