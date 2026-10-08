export type DemoCartItem = { productId: string; quantity: number }
export type DemoPricedProduct = { id: string; basePrice: number }
export type DemoTotals = {
  subtotal: number
  discount: number
  tax: number
  total: number
}
export type DemoReceipt = DemoTotals & {
  customerName: string
  items: DemoCartItem[]
}
export type DemoProduct = DemoPricedProduct & {
  name: string
  description: string
  image: string
  category: string
  badge: string
}
export type DemoScreen = "menu" | "checkout" | "tracking" | "dashboard"
export type DemoContextValue = {
  products: DemoProduct[]
  cart: DemoCartItem[]
  discountCode: string
  receipt: DemoReceipt | null
  customerName: string
  status: "Pending" | "Preparing" | "Ready" | "Completed"
  changeQuantity: (id: string, quantity: number) => void
  setDiscountCode: (code: string) => void
  setCustomerName: (name: string) => void
  placeOrder: () => boolean
  advanceOrder: () => void
  resetOrder: () => void
}
