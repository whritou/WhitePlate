import { expect, it } from "vitest"
import { parseStorefrontMenu } from "./responses"
import { parsePublicOrderTracking } from "./public-order-tracking"
import { parsePublicEstablishment } from "./establishment-settings"

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

it("preserves distinct weekdays, closed days, and split service periods", () => {
  const schedule = {
    days: Array.from({ length: 7 }, (_, index) => ({
      dayOfWeek: index + 1,
      isClosed: index === 0,
      windows:
        index === 0
          ? []
          : index === 1
            ? [
                { start: "09:00", end: "12:00" },
                { start: "14:00", end: "18:00" },
              ]
            : [{ start: "10:00", end: "16:00" }],
    })),
  }
  const parsed = parsePublicEstablishment({
    name: "Bistro",
    phone: null,
    addressLine1: null,
    addressLine2: null,
    postalCode: null,
    city: null,
    region: null,
    countryCode: null,
    latitude: null,
    longitude: null,
    timeZone: "Europe/Paris",
    pickupInstruction: null,
    pickupLocale: null,
    openingHours: schedule,
  })

  expect(parsed?.openingHours?.days[0]).toMatchObject({
    isClosed: true,
    windows: [],
  })
  expect(parsed?.openingHours?.days[1].windows).toEqual(
    schedule.days[1].windows
  )
  expect(parsed?.openingHours?.days[2].windows[0].start).toBe("10:00")
})
