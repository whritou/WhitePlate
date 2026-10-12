import { expect, it } from "vitest"
import {
  establishmentDraft,
  establishmentDraftErrors,
  establishmentInput,
} from "./establishment-draft"
import { establishmentLinks } from "./establishment-links"
import { parsePublicEstablishment } from "./validation/establishment-settings"
import type { EstablishmentSettings } from "@/types/establishment-settings"

export const settings: EstablishmentSettings = {
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
  timeZone: "UTC",
  pickupScheduling: {
    intervalMinutes: 15,
    minimumLeadMinutes: 20,
    capacity: 8,
  },
  openingHours: null,
  establishmentVersion: 1,
  locales: ["en", "fr"],
  defaultLocale: "en",
  pickupInstructions: { en: "Counter" },
}

const options = { timeZones: ["UTC", "Europe/Paris"], countries: ["FR", "GB"] }

it("roundtrips optional fields and localized clearing without losing zero coordinates", () => {
  const draft = {
    ...establishmentDraft(settings),
    name: " New Bistro ",
    latitude: "0",
    longitude: "0",
    pickupInstructions: { en: "", fr: " Comptoir " },
  }

  expect(establishmentDraftErrors(draft, options)).toEqual({})
  expect(
    establishmentInput("11111111-1111-4111-8111-111111111111", settings, draft)
  ).toMatchObject({
    name: "New Bistro",
    phone: null,
    latitude: 0,
    longitude: 0,
    pickupInstructions: { en: "", fr: "Comptoir" },
    establishmentVersion: 1,
  })
})

it.each([
  { addressLine2: "Floor 2" },
  { latitude: "1" },
  { latitude: "Infinity", longitude: "0" },
  { latitude: "91", longitude: "0" },
  { phone: "javascript:123" },
  { phone: "12" },
  { timeZone: "Romance Standard Time" },
  { countryCode: "ZZ" },
  { name: " " },
])("rejects invalid user input %o", (input) => {
  expect(
    Object.keys(
      establishmentDraftErrors(
        { ...establishmentDraft(settings), ...input },
        options
      )
    ).length
  ).toBeGreaterThan(0)
})

it("uses fixed HTTPS origins and encoded international addresses, with Waze only for valid coordinates", () => {
  const publicSettings = {
    ...settings,
    pickupInstruction: null,
    pickupLocale: null,
    name: "Bistro & café",
    addressLine1: "1 Rue #A",
    city: "Paris",
    countryCode: "FR",
  }
  const links = establishmentLinks(publicSettings)
  const google = new URL(links.google!)

  expect(google.origin).toBe("https://www.google.com")
  expect(google.searchParams.get("destination")).toContain(
    "Bistro & café, 1 Rue #A"
  )
  expect(links.waze).toBeNull()
  expect(
    establishmentLinks({ ...publicSettings, latitude: 0, longitude: 0 }).waze
  ).toBe("https://www.waze.com/ul?ll=0%2C0&navigate=yes")
  expect(
    establishmentLinks({ ...publicSettings, phone: "javascript:123" }).phone
  ).toBeNull()
  expect(
    establishmentLinks({
      ...settings,
      pickupInstruction: null,
      pickupLocale: null,
    }).google
  ).toBeNull()
})

it.each([
  { latitude: 91, longitude: 0 },
  { latitude: 0, longitude: null },
  { timeZone: "Invalid/Zone" },
  { pickupInstruction: "x".repeat(1001) },
])("does not render malformed additive public data %o", (bad) => {
  expect(
    parsePublicEstablishment({
      ...settings,
      pickupInstruction: null,
      pickupLocale: null,
      ...bad,
    })
  ).toBeNull()
})
