import { describe, expect, it } from "vitest"
import { createGuestCheckoutStore } from "./guest-checkout-store"

describe("guest checkout store", () => {
  it("keeps guest carts isolated to their restaurant provider", () => {
    const restaurantA = createGuestCheckoutStore("tenant-a")
    const restaurantB = createGuestCheckoutStore("tenant-b")

    restaurantA.getState().changeCart({
      productId: "11111111-1111-1111-1111-111111111111",
      quantity: 2,
      optionIds: [],
    })

    expect(restaurantA.getState().cart).toHaveLength(1)
    expect(restaurantB.getState().cart).toEqual([])
  })

  it("clears guest input and capabilities when starting a new order", () => {
    const store = createGuestCheckoutStore("tenant-a")

    store.getState().changeCustomerName("Guest")
    store.getState().changeDiscountCode("SAVE")
    store.getState().setAttempt({
      key: "idempotency-key",
      input: {
        customerName: "Guest",
        discountCode: "SAVE",
        menuLocale: "en",
        trackingToken: "a".repeat(43),
        items: [],
      },
    })

    store.getState().startNewOrder()

    expect(store.getState().customerName).toBe("")
    expect(store.getState().discountCode).toBe("")
    expect(store.getState().attempt).toBeNull()
  })
})
