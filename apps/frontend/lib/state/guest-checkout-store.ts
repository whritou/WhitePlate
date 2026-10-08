import { updateCart } from "@/lib/checkout/cart"
import type { GuestCheckoutState } from "@/types/state"
import { createStoreFactory } from "./store-factory"

export const createGuestCheckoutStore = createStoreFactory<
  string,
  GuestCheckoutState
>((_tenantId, set) => ({
  cart: [],
  customerName: "",
  discountCode: "",
  error: null,
  submitting: false,
  receipt: null,
  orderRound: 0,
  attempt: null,
  inFlight: false,
  changeCart: (item) =>
    set((state) => ({ cart: updateCart(state.cart, item), error: null })),
  changeCustomerName: (customerName) => set({ customerName, error: null }),
  changeDiscountCode: (discountCode) => set({ discountCode, error: null }),
  setError: (error) => set({ error }),
  setSubmitting: (submitting) => set({ submitting }),
  setReceipt: (receipt) => set({ receipt }),
  setAttempt: (attempt) => set({ attempt }),
  setInFlight: (inFlight) => set({ inFlight }),
  clearCart: () => set({ cart: [] }),
  startNewOrder: () =>
    set((state) => ({
      receipt: null,
      attempt: null,
      error: null,
      customerName: "",
      discountCode: "",
      orderRound: state.orderRound + 1,
    })),
}))
