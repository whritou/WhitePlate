"use client"
import { type MenuData } from "@/lib/lovable/menu"
import type { StoreTheme } from "@/lib/lovable/storeTheme"
import type { CartDraft } from "@/lib/lovable/customerOrder"
import { useCustomerCheckoutModel } from "./CustomerCheckout-CustomerCheckout-model"
import { CustomerCheckoutProvider } from "./CustomerCheckout-CustomerCheckout-context"
import { CustomerCheckoutView } from "./CustomerCheckout-CustomerCheckout-view"
export function CustomerCheckout({
  t,
  menu,
  cart,
  onChange,
  onPlace,
  preview = false,
}: {
  t: StoreTheme
  menu: MenuData
  cart: CartDraft
  onChange: (cart: CartDraft) => void
  onPlace?: (details: {
    name: string
    pickup: string
    notes: string
    subtotal: number
    discount: number
    total: number
  }) => void
  preview?: boolean
}) {
  const model = useCustomerCheckoutModel({
    t,
    menu,
    cart,
    onChange,
    onPlace,
    preview,
  })

  return (
    <CustomerCheckoutProvider model={model}>
      <CustomerCheckoutView />
    </CustomerCheckoutProvider>
  )
}

export { OrderItems } from "./CustomerCheckout-shared"
