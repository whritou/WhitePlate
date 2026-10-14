import type { RestaurantRole } from "./orders"

export type OrderingOperations = {
  acceptingOrders: boolean
  rushHoldEnabled: boolean
  rushBufferMinutes: number
  version: number
}

export type OrderingOperationsScope = {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
}

export type OrderingOperationsUpdate = {
  tenantId: string
  version: number
  acceptingOrders: boolean
  rushHoldEnabled: boolean
}

export type RequestedOrderingOperationsChange = {
  acceptingOrders: boolean
  rushHoldEnabled: boolean
  kind: "pause" | "resume" | "enableRush" | "clearRush"
} | null
