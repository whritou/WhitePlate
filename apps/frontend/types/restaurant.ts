import type { Restaurant } from "./organization"

export type RestaurantInput = {
  organizationId: string
  name: string
  subdomain: string
  currency: "EUR" | "USD" | "GBP"
}

export type RestaurantError =
  "invalid" | "conflict" | "unauthorized" | "forbidden" | "unavailable"

export type RestaurantResult =
  { ok: true; restaurant: Restaurant } | { ok: false; message: RestaurantError }

export type RestaurantFormProps = { organizationId: string }

export type RestaurantPageProps = {
  searchParams: Promise<{ organizationId?: string }>
}
