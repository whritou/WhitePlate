import { expect, it } from "vitest"
import { parseTenantLegalProfile } from "./legal-profile"

it("parses inherited legal profiles without confusing them with empty custom values", () => {
  const profile = {
    mode: "inherit",
    organizationProfile: {
      countryCode: "FR",
      name: "Maison Verte SAS",
      registrationNumber: "732829320",
      taxIdentifier: "FR88732829320",
    },
    effectiveProfile: {
      countryCode: "FR",
      name: "Maison Verte SAS",
      registrationNumber: "732829320",
      taxIdentifier: "FR88732829320",
    },
    version: 1,
  }

  expect(parseTenantLegalProfile(profile)).toEqual(profile)
})

it("rejects malformed legal-profile modes and versions", () => {
  const base = {
    mode: "inherit",
    organizationProfile: {
      countryCode: null,
      name: null,
      registrationNumber: null,
      taxIdentifier: null,
    },
    effectiveProfile: {
      countryCode: null,
      name: null,
      registrationNumber: null,
      taxIdentifier: null,
    },
    version: 1,
  }

  expect(parseTenantLegalProfile({ ...base, mode: "unknown" })).toBeNull()
  expect(parseTenantLegalProfile({ ...base, version: 0 })).toBeNull()
  expect(
    parseTenantLegalProfile({
      ...base,
      effectiveProfile: { countryCode: "FR", name: 42 },
    })
  ).toBeNull()
})
