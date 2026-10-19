import type { ApiError } from "@/types/api"

export type CartItem = {
  productId: string
  quantity: number
  optionIds: string[]
}

export type OrderQuoteInput = {
  menuLocale: string
  discountCode: string | null
  items: CartItem[]
}

export type PreviewPriceLine = {
  unit: number
  qty: number
  product: { tax?: number }
}

export type OrderInput = {
  customerName: string
  customerPhone?: string
  orderNotes?: string
  customerEmail: string
  emailUpdatesConsented: boolean
  analyticsConsented?: boolean
  analyticsSource?: "web" | "qr"
  discountCode: string | null
  menuLocale: string
  trackingToken?: string
  pickupAt?: string | null
  items: CartItem[]
}

export type PickupSlot = {
  startsAt: string
  endsAt: string
  remainingCapacity: number
  timeZone: string
}
export type PickupAvailability = {
  state:
    | "available"
    | "schedule_not_configured"
    | "no_slots_available"
    | "orders_paused"
  timeZone: string | null
  slots: PickupSlot[]
  acceptingOrders?: boolean
  rushHoldEnabled?: boolean
  rushBufferMinutes?: number
}

export type PublicOrderTracking = {
  summary?: PublicOrderSummary
  menuLocale?: string | null
  id: string
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled"
  version: number
  createdAt: string
  pickupAt?: string | null
  pickupTimeZone?: string | null
}

export type PublicOrderSummary = {
  currency: string
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  lines: {
    productId: string
    productName: string
    quantity: number
    subtotal: number
    total: number
    options: { optionId: string; name: string; priceAdjustment: number }[]
  }[]
}

export type CheckoutAttempt = { key: string; input: OrderInput }

export type SelectableProduct = {
  isAvailable: boolean
  optionGroups: {
    minimumSelections: number
    maximumSelections: number
    options: { id: string }[]
  }[]
}

export type OrderReceipt = {
  id: string
  tenantId: string
  currency: string
  customerName: string
  menuLocale: string | null
  discountCode: string | null
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
  status: string
  version: number
  createdAt: string
  pickupAt: string | null
  pickupTimeZone: string | null
  lines: {
    productId: string
    productName: string
    baseUnitPrice: number
    taxRatePercent: number
    quantity: number
    subtotal: number
    discountAmount: number
    taxAmount: number
    total: number
    options: { optionId: string; name: string; priceAdjustment: number }[]
  }[]
}

export type CheckoutResult =
  { ok: true; receipt: OrderReceipt } | { ok: false; error: ApiError }

export type CheckoutConfiguration = {
  baseDomain: string | undefined
  apiTemplate: string | undefined
  pathBaseDomain?: string | undefined
  centralApiUrl?: string | undefined
}

export type GuestCheckoutController = ReturnType<
  typeof import("@/hooks/use-guest-checkout").useGuestCheckout
>
export type CheckoutPanelProps = {
  checkoutState: GuestCheckoutController
  mode: "cart" | "checkout"
  estimatedSubtotal?: string
  onBack?: () => void
  onContinue?: () => void
  onNewOrder: () => void
}

export type CheckoutEmailUpdatesProps = {
  customerEmail: string
  emailUpdatesConsented: boolean
  analyticsConsented?: boolean
  changeCustomerEmail: (value: string) => void
  changeEmailUpdatesConsent: (value: boolean) => void
  changeAnalyticsConsent?: (value: boolean) => void
}

export type CheckoutPickupSelectorProps = {
  customer?: boolean
  pickupSlots: PickupSlot[]
  pickupSlotsLoading: boolean
  pickupAvailabilityState: PickupAvailability["state"]
  selectedPickupAt: string
  changePickupAt: (value: string) => void
}
