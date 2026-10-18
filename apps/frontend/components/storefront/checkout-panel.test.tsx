import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { GuestCheckoutController } from "@/types/checkout"
import { CheckoutPanel } from "./checkout-panel"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock("@/i18n/navigation", () => ({
  Link: () => null,
}))

vi.mock("./receipt", () => ({ Receipt: () => null }))

it("shows the server pause and rush buffer in an existing guest cart", () => {
  const state = {
    cart: [{ productId: "product-1", quantity: 1, optionIds: [] }],
    customerName: "Ada",
    customerEmail: "",
    emailUpdatesConsented: false,
    discountCode: "",
    error: null,
    submitting: false,
    receipt: null,
    changingLanguage: false,
    locked: false,
    products: [],
    trackingToken: null,
    changeCart: vi.fn(),
    checkout: vi.fn(),
    changeCustomerName: vi.fn(),
    changeCustomerEmail: vi.fn(),
    changeEmailUpdatesConsent: vi.fn(),
    changeDiscountCode: vi.fn(),
    pickupSlots: [],
    pickupSlotsLoading: false,
    pickupAvailabilityState: "orders_paused",
    pickupRushBufferMinutes: 10,
    selectedPickupAt: "asap",
    changePickupAt: vi.fn(),
  } as unknown as GuestCheckoutController

  const html = renderToStaticMarkup(
    createElement(CheckoutPanel, {
      checkoutState: state,
      mode: "checkout",
      onNewOrder: vi.fn(),
    })
  )

  expect(html).toContain("ordersPaused")
  expect(html).toContain("rushBufferNotice")
  expect(html).toContain('id="email-updates-consent"')
  expect(html).not.toContain('id="customer-email"')
})
