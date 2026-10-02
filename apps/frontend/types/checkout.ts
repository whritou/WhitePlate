import type { ApiError } from "@/types/api"

export type CartItem = {
  productId: string
  quantity: number
  optionIds: string[]
}

export type OrderInput = {
  customerName: string
  discountCode: string | null
  menuLocale: string
  items: CartItem[]
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
}

export type GuestCheckoutController = ReturnType<
  typeof import("@/hooks/use-guest-checkout").useGuestCheckout
>
export type CheckoutPanelProps = {
  checkoutState: GuestCheckoutController
}
