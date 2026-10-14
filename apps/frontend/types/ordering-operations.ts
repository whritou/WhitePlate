import type { RestaurantRole } from "./orders"
import type { ReactNode } from "react"

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

export type OrderingOperationsControllerProps = {
  userId: string
  tenantId: string
  locale: string
  role: RestaurantRole
  initialOperations: OrderingOperations | null
  children?: ReactNode
}

export type OrderingOperationsControllerValue = {
  role: RestaurantRole
  requestedChange: RequestedOrderingOperationsChange
  state: {
    operations: OrderingOperations | null
    loadError: string | null
    updateError: string | null
    isInitialLoading: boolean
    isFetching: boolean
    isUpdating: boolean
    updateSucceeded: boolean
    retry: () => Promise<unknown>
    update: (input: {
      acceptingOrders: boolean
      rushHoldEnabled: boolean
    }) => Promise<OrderingOperations>
    clearUpdateFeedback: () => void
  }
  requestChange: (
    kind: NonNullable<RequestedOrderingOperationsChange>["kind"]
  ) => void
  confirmChange: () => Promise<void>
  closeChange: () => void
}

export type OrderingOperationsPresentation = "card" | "compact"

export type OrderingOperationsStatusCounts = {
  Pending?: number
  Preparing?: number
  Ready?: number
}

export type RequestedOrderingOperationsChange = {
  acceptingOrders: boolean
  rushHoldEnabled: boolean
  kind: "pause" | "resume" | "enableRush" | "clearRush"
} | null
