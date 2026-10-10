import { useDemoDraft, useDemoHydrated } from "@/hooks/lovable/use-demo-draft"
import type { CartDraft, CustomerOrder } from "@/types/lovable/customerOrder"

import { DEFAULT_MENU } from "@/lib/lovable/menu"
export type {
  CartLine,
  CartDraft,
  CustomerOrder,
} from "@/types/lovable/customerOrder"

const CART_KEY = "whiteplate-lovable-demo-checkout-draft"
const ORDER_KEY = "whiteplate-lovable-demo-customer-orders"

export const EMPTY_CART: CartDraft = { lines: [], code: "", lang: "en" }
export function readCart(): CartDraft {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY) || "null") ?? EMPTY_CART
  } catch {
    return EMPTY_CART
  }
}

export function writeCart(cart: CartDraft) {
  try {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart))

    return true
  } catch {
    return false
  }
}

export function saveCustomerOrder(order: CustomerOrder) {
  try {
    const orders = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "{}")

    sessionStorage.setItem(
      ORDER_KEY,
      JSON.stringify({ ...orders, [order.id]: order })
    )
    sessionStorage.removeItem(CART_KEY)

    return true
  } catch {
    return false
  }
}

export function readCustomerOrder(id: string): CustomerOrder | null {
  try {
    return JSON.parse(sessionStorage.getItem(ORDER_KEY) || "{}")[id] ?? null
  } catch {
    return null
  }
}

export function useCustomerCart() {
  const [cart, setCart] = useDemoDraft<CartDraft>(EMPTY_CART, readCart)
  const loaded = useDemoHydrated()
  const update = (next: CartDraft) => {
    setCart(next)
    writeCart(next)
  }

  return { cart, update, loaded }
}

export const PREVIEW_CART: CartDraft = {
  lines: DEFAULT_MENU.categories
    .flatMap((c) => c.items)
    .filter((p) => ["burger", "tiramisu"].includes(p.id))
    .map((product) => ({
      key: product.id,
      product,
      picks: product.id === "burger" ? ["Medium", "Fries"] : [],
      unit: product.p,
      qty: 1,
    })),
  code: "",
  lang: "en",
}
export const PREVIEW_ORDER: CustomerOrder = {
  id: "WP-1048",
  lines: PREVIEW_CART.lines,
  subtotal: 24,
  discount: 0,
  total: 24,
  name: "Alex",
  pickup: "As soon as possible",
  notes: "",
  createdAt: "",
  lang: "en",
}
