export type Status = "Collected" | "Refunded" | "Cancelled"
export type Item = { q: number; n: string; p: number; tax: number }
export type Order = {
  id: string
  date: Date
  customer: string
  email: string
  channel: "Web" | "QR" | "Phone"
  payment: "Card" | "Apple Pay" | "Cash"
  status: Status
  items: Item[]
  discount: number
  code?: string
}
export type SortKey = "id" | "date" | "customer" | "total"
