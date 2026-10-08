import type { StoreApi } from "zustand/vanilla"
import type { ApiError } from "@/types/api"
import type { CartItem, CheckoutAttempt, OrderReceipt } from "@/types/checkout"

export type StoreInitializer<TInput, TState> = (
  input: TInput,
  set: StoreApi<TState>["setState"]
) => TState

export type TenantSelectionState = {
  tenantId: string | null
  selectTenant: (tenantId: string | null) => void
}

export type GuestCheckoutState = {
  cart: CartItem[]
  customerName: string
  discountCode: string
  error: ApiError | null
  submitting: boolean
  receipt: OrderReceipt | null
  orderRound: number
  attempt: CheckoutAttempt | null
  inFlight: boolean
  changeCart: (item: CartItem) => void
  changeCustomerName: (value: string) => void
  changeDiscountCode: (value: string) => void
  setError: (error: ApiError | null) => void
  setSubmitting: (submitting: boolean) => void
  setReceipt: (receipt: OrderReceipt | null) => void
  setAttempt: (attempt: CheckoutAttempt | null) => void
  setInFlight: (inFlight: boolean) => void
  clearCart: () => void
  startNewOrder: () => void
}
