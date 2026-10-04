import { isUuid } from "./common"
import type { RestaurantInput } from "@/types/restaurant"

export function parseRestaurantInput(input: unknown): RestaurantInput | null {
  if (!(input instanceof FormData)) return null

  const organizationId = input.get("organizationId")
  const rawName = input.get("name")
  const rawSubdomain = input.get("subdomain")
  const rawCurrency = input.get("currency")

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
    (currency !== "EUR" && currency !== "USD" && currency !== "GBP")
  )
    return null

  return { organizationId, name, subdomain, currency }
}
