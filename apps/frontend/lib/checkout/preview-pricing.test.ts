import { expect, it } from "vitest"
import { previewPricing } from "./preview-pricing"

it("allocates rounded discounts before applying each product tax like the API", () => {
  expect(
    previewPricing([{ unit: 9.75, qty: 2, product: { tax: 10 } }], 2)
  ).toEqual({ subtotal: 19.5, discount: 2, taxAmount: 1.75, total: 19.25 })
  expect(
    previewPricing(
      [
        { unit: 0.05, qty: 1, product: { tax: 10 } },
        { unit: 0.05, qty: 1, product: { tax: 20 } },
      ],
      0.01
    )
  ).toEqual({ subtotal: 0.1, discount: 0.01, taxAmount: 0.01, total: 0.1 })
})
