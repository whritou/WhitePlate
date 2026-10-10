"use client"
import { Copy } from "@/components/lovable/copy"
import type { Order } from "@/types/lovable/backoffice"
import { createContext, useContext, useState, type ReactNode } from "react"
export type { Status, Order } from "@/types/lovable/backoffice"

const SEED: Order[] = [
  {
    id: "1042",
    customer: "Léa M.",
    pickup: "12:30",
    placedMin: 2,
    total: 34.5,
    channel: "Web",
    paid: true,
    status: "new",
    items: [
      { q: 2, n: "Burger Maison", note: "no onions" },
      { q: 1, n: "Truffle fries" },
      { q: 2, n: "Lemonade" },
    ],
  },
  {
    id: "1043",
    customer: "Tom R.",
    pickup: "12:35",
    placedMin: 1,
    total: 18,
    channel: "QR",
    paid: true,
    status: "new",
    items: [
      { q: 1, n: "Green bowl" },
      { q: 1, n: "Kombucha" },
    ],
  },
  {
    id: "1044",
    customer: "Sarah K.",
    pickup: "12:45",
    placedMin: 0,
    total: 52.9,
    channel: "Phone",
    paid: false,
    status: "new",
    items: [
      { q: 3, n: "Margherita" },
      { q: 1, n: "Tiramisu", note: "extra cocoa" },
    ],
  },
  {
    id: "1038",
    customer: "Hugo B.",
    pickup: "12:20",
    placedMin: 9,
    total: 27.4,
    channel: "Web",
    paid: true,
    status: "preparing",
    items: [
      { q: 1, n: "Poke salmon" },
      { q: 1, n: "Miso soup" },
      { q: 1, n: "Mochi x3" },
    ],
  },
  {
    id: "1039",
    customer: "Inès D.",
    pickup: "12:25",
    placedMin: 14,
    total: 41,
    channel: "Web",
    paid: true,
    status: "preparing",
    items: [
      { q: 2, n: "Chicken wrap", note: "1 gluten-free" },
      { q: 2, n: "Iced tea" },
    ],
  },
  {
    id: "1035",
    customer: "Marc P.",
    pickup: "12:15",
    placedMin: 18,
    total: 15.5,
    channel: "QR",
    paid: true,
    status: "ready",
    items: [
      { q: 1, n: "Burger Maison" },
      { q: 1, n: "Coke" },
    ],
  },
  {
    id: "1031",
    customer: "Julie V.",
    pickup: "12:05",
    placedMin: 31,
    total: 63.2,
    channel: "Web",
    paid: true,
    status: "collected",
    items: [{ q: 4, n: "Family box" }],
  },
  {
    id: "1030",
    customer: "Ali S.",
    pickup: "12:00",
    placedMin: 36,
    total: 22,
    channel: "Phone",
    paid: true,
    status: "collected",
    items: [{ q: 2, n: "Green bowl" }],
  },
]

function useServiceState() {
  const [orders, setOrders] = useState<Order[]>(SEED)
  const [paused, setPaused] = useState(false)

  return { orders, setOrders, paused, setPaused }
}

const BackofficeContext = createContext<ReturnType<
  typeof useServiceState
> | null>(null)

export function BackofficeProvider({ children }: { children: ReactNode }) {
  const state = useServiceState()

  return (
    <BackofficeContext.Provider value={state}>
      <Copy>{children}</Copy>
    </BackofficeContext.Provider>
  )
}

export function useBackoffice() {
  const state = useContext(BackofficeContext)

  if (!state) throw new Error("Back-office state requires BackofficeProvider")

  return state
}
