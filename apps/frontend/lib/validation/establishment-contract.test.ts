import { expect, it } from "vitest"
import { parseStorefrontMenu } from "./responses"
import { parsePublicOrderTracking } from "./public-order-tracking"

const id = "11111111-1111-4111-8111-111111111111"

it("retains saved public pickup information and the order menu locale", () => {
  const establishment = {
    name: "Bistro",
    phone: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: null,
    region: null,
    countryCode: null,
    latitude: 0,
    longitude: 2,
    timeZone: "Europe/Paris",
    pickupInstruction: "Au comptoir",
    pickupLocale: "fr",
  }

  expect(
    parseStorefrontMenu({
      tenantId: id,
      restaurantName: "Bistro",
      restaurantDescription: null,
      currency: "EUR",
      locale: "fr",
      defaultLocale: "en",
      availableLocales: ["en", "fr"],
      categories: [],
      establishment,
    })
  ).toMatchObject({ establishment })
  expect(
    parsePublicOrderTracking(
      {
        id,
        status: "Ready",
        version: 2,
        createdAt: "2026-10-12T12:00:00Z",
        menuLocale: "fr",
      },
      id
    )
  ).toMatchObject({ menuLocale: "fr" })
})
