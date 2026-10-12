import { isUuid } from "./common"
import type { RestaurantInput } from "@/types/restaurant"

export function parseRestaurantInput(input: unknown): RestaurantInput | null {
  if (!(input instanceof FormData)) return null

  const organizationId = input.get("organizationId")
  const rawName = input.get("name")
  const rawSubdomain = input.get("subdomain")
  const rawCurrency = input.get("currency")
  const rawLegalProfileMode = input.get("legalProfileMode")
  const legalProfileMode =
    rawLegalProfileMode === "custom" ? "custom" : "inherit"
  const legalCountryCode = input.get("legalCountryCode")
  const legalName = input.get("legalName")
  const legalRegistrationNumber = input.get("legalRegistrationNumber")
  const taxIdentifier = input.get("taxIdentifier")

  if (
    !isUuid(organizationId) ||
    typeof rawName !== "string" ||
    typeof rawSubdomain !== "string" ||
    typeof rawCurrency !== "string"
  )
    return null

  const name = rawName.trim()
  const subdomain = rawSubdomain.trim().toLowerCase()
  const currency = rawCurrency.trim().toUpperCase()

  if (
    !name ||
    name.length > 200 ||
    subdomain.length > 63 ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(subdomain) ||
    ["www", "api", "admin", "app"].includes(subdomain) ||
    (currency !== "EUR" && currency !== "USD" && currency !== "GBP") ||
    (legalProfileMode === "custom" &&
      (typeof legalCountryCode !== "string" ||
        !["FR", "DE", "GB", "US"].includes(legalCountryCode))) ||
    [legalName, legalRegistrationNumber, taxIdentifier].some(
      (value) =>
        value !== null && (typeof value !== "string" || value.length > 200)
    )
  )
    return null

  return {
    organizationId,
    name,
    subdomain,
    currency,
    legalProfileMode,
    legalCountryCode:
      legalProfileMode === "custom" ? (legalCountryCode as string) : null,
    legalName: typeof legalName === "string" ? legalName.trim() || null : null,
    legalRegistrationNumber:
      typeof legalRegistrationNumber === "string"
        ? legalRegistrationNumber.trim() || null
        : null,
    taxIdentifier:
      typeof taxIdentifier === "string" ? taxIdentifier.trim() || null : null,
  }
}
