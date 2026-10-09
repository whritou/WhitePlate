export type Status = "new" | "preparing" | "ready" | "collected"
export type Order = {
  id: string
  customer: string
  pickup: string
  placedMin: number
  total: number
  items: { q: number; n: string; note?: string }[]
  status: Status
  channel: "Web" | "QR" | "Phone"
  paid: boolean
}
