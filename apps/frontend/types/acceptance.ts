import type {
  APIRequestContext,
  Browser,
  BrowserContext,
} from "@playwright/test"
import type { Client } from "pg"

export type AcceptanceRestaurant = {
  organizationId: string
  tenantId: string
  name: string
  slug: string
  currency: string
}
export type AcceptanceActor = {
  id: string
  email: string
  context: BrowserContext
  token: string
}
export type StaffFixture = {
  restaurant: AcceptanceRestaurant
  database: Client
  owner: AcceptanceActor
  manager: AcceptanceActor
  kitchen: AcceptanceActor
  foreign: AcceptanceActor
  productId: string
  otherTenantId: string
  otherTenantSlug: string
  cleanup: () => Promise<void>
}
export type ActorOptions = {
  browser: Browser
  database: Client
  role: string
  stamp: string
}
export type AcceptanceApiInput = {
  request: APIRequestContext
  token: string
  tenantId: string
  orderId: string
  version: number
  status: string
}
