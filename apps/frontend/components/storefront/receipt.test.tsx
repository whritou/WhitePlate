import { createElement } from "react"
import type { ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { OrderReceipt } from "@/types/checkout"
import { Receipt } from "./receipt"

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useMessages: () => ({}),
  useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children }: { children: ReactNode }) =>
    createElement("a", undefined, children),
}))
vi.mock("./current-collection-information", () => ({
  CurrentCollectionInformation: () => null,
}))

it("uses the customer two-column recipe for receipt details and order summary", () => {
  const receipt: OrderReceipt = {
    id: "11111111-1111-4111-8111-111111111111",
    tenantId: "22222222-2222-4222-8222-222222222222",
    currency: "EUR",
    customerName: "Ada Lovelace",
    menuLocale: "fr",
    discountCode: null,
    subtotal: 11,
    discountAmount: 0,
    taxAmount: 1.1,
    total: 12.1,
    status: "Pending",
    version: 1,
    createdAt: "2026-10-18T10:00:00.000Z",
    pickupAt: null,
    pickupTimeZone: null,
    lines: [
      {
        productId: "33333333-3333-4333-8333-333333333333",
        productName: "Burrata & tomates anciennes",
        baseUnitPrice: 11,
        taxRatePercent: 10,
        quantity: 1,
        subtotal: 11,
        discountAmount: 0,
        taxAmount: 1.1,
        total: 12.1,
        options: [],
      },
    ],
  }

  const html = renderToStaticMarkup(
    createElement(Receipt, {
      receipt,
      trackingToken: "a".repeat(43),
      restaurantSlug: "maison-verte",
      restaurantPhone: "+33 9 87 65 43 21",
    })
  )

  expect(html).toContain('class="customer-two-column')
  expect(html).toContain('class="customer-summary')
  expect(html).toContain("orderConfirmed")
  expect(html).toContain("Burrata &amp; tomates anciennes")
  expect(html).toContain("trackOrder")
  expect(html).toContain('href="tel:+33987654321"')

  const withoutPhone = renderToStaticMarkup(
    createElement(Receipt, {
      receipt,
      trackingToken: null,
      restaurantPhone: null,
    })
  )

  expect(withoutPhone).not.toContain('href="tel:')
})
