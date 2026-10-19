import { updateCart } from "@/lib/checkout/cart"
import type { GuestCheckoutState } from "@/types/state"
import { createStoreFactory } from "./store-factory"

export const createGuestCheckoutStore = createStoreFactory<
  string,
  GuestCheckoutState
>((_tenantId, set) => ({
  cart: [],
  customerName: "",
  customerPhone: "",
  orderNotes: "",
  customerEmail: "",
  emailUpdatesConsented: false,
  analyticsConsented: false,
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
  changeCustomerPhone: (customerPhone) => set({ customerPhone, error: null }),
  changeOrderNotes: (orderNotes) => set({ orderNotes, error: null }),
  changeCustomerEmail: (customerEmail) => set({ customerEmail, error: null }),
  changeEmailUpdatesConsent: (emailUpdatesConsented) =>
    set((state) => ({
      emailUpdatesConsented,
      customerEmail:
        emailUpdatesConsented || state.analyticsConsented
          ? state.customerEmail
          : "",
      error: null,
    })),
  changeAnalyticsConsent: (analyticsConsented) =>
    set((state) => ({
      analyticsConsented,
      customerEmail:
        analyticsConsented || state.emailUpdatesConsented
          ? state.customerEmail
          : "",
      error: null,
    })),
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
      customerPhone: "",
      orderNotes: "",
      customerEmail: "",
      emailUpdatesConsented: false,
      analyticsConsented: false,
      discountCode: "",
      orderRound: state.orderRound + 1,
    })),
}))
