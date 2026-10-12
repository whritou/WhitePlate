import type { Restaurant } from "./organization"

export type RestaurantInput = {
  organizationId: string
  name: string
  subdomain: string
  currency: "EUR" | "USD" | "GBP"
  legalProfileMode: "inherit" | "custom"
  legalCountryCode: string | null
  legalName: string | null
  legalRegistrationNumber: string | null
  taxIdentifier: string | null
}

export type RestaurantError =
  "invalid" | "conflict" | "unauthorized" | "forbidden" | "unavailable"

export type RestaurantResult =
  { ok: true; restaurant: Restaurant } | { ok: false; message: RestaurantError }

export type RestaurantFormProps = {
  organizationId: string
  organizationProfile: {
    legalCountryCode?: string | null
    legalName?: string | null
    legalRegistrationNumber?: string | null
    taxIdentifier?: string | null
  }
}

export type RestaurantPageProps = {
  searchParams: Promise<{ organizationId?: string }>
}
