import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { expect, it, vi } from "vitest"
import type { GuestCheckoutController } from "@/types/checkout"
import { LiveCheckoutDetails } from "./live-checkout-details"

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useMessages: () => ({}),
}))

vi.mock("@/components/storefront/collection-information", () => ({
  CollectionInformation: () => null,
}))

it("uses the real checkout consent and pickup controls", () => {
  const state = {
    cart: [{ productId: "product-1", quantity: 1, optionIds: [] }],
    locked: false,
    customerName: "Ada",
    customerEmail: "",
    emailUpdatesConsented: false,
    analyticsConsented: false,
    changeCustomerName: vi.fn(),
    changeCustomerEmail: vi.fn(),
    changeEmailUpdatesConsent: vi.fn(),
    changeAnalyticsConsent: vi.fn(),
    pickupSlots: [],
    pickupSlotsLoading: false,
    pickupAvailabilityState: "schedule_not_configured",
    pickupRushBufferMinutes: 10,
    selectedPickupAt: "asap",
    changePickupAt: vi.fn(),
  } as unknown as GuestCheckoutController

  const html = renderToStaticMarkup(
    createElement(LiveCheckoutDetails, {
      state,
      name: "Bistro",
      establishment: null,
    })
  )

  expect(html).toContain('id="email-updates-consent"')
  expect(html).toContain('id="analytics-consent"')
  expect(html).toContain('id="pickup-time"')
  expect(html).toContain("rushBufferNotice")
  expect(html).not.toContain("client@example.test")
  expect(html).not.toContain("Choose a time")
})
