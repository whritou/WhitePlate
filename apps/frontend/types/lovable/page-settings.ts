export type Restaurant = {
  id: string
  name: string
  address: string
  phone: string
  status: "open" | "paused" | "archived"
  prep: number
  hours: string
}
export type State = {
  org: {
    name: string
    legal: string
    vat: string
    siret: string
    email: string
    address: string
    currency: string
    timezone: string
  }
  restaurants: Restaurant[]
  stripe: boolean
  plan: "starter" | "pro" | "scale"
  annual: boolean
  domains: { host: string; status: "verified" | "pending" }[]
  notif: Record<string, boolean>
}
export type Section =
  | "org"
  | "restaurants"
  | "payments"
  | "billing"
  | "domains"
  | "notifications"
  | "danger"
