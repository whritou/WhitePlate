import type { Product } from "@/lib/lovable/menu"
export type CartLine = {
  key: string
  product: Product
  picks: string[]
  unit: number
  qty: number
}
export type CartDraft = { lines: CartLine[]; code: string; lang: string }
export type CustomerOrder = {
  id: string
  lines: CartLine[]
  subtotal: number
  discount: number
  total: number
  name: string
  pickup: string
  notes: string
  createdAt: string
  lang: string
}
