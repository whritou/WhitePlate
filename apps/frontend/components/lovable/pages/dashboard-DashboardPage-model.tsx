"use client"
import { CircleAlert, ShoppingBag, Wallet, Utensils } from "lucide-react"
import { useBackoffice } from "@/lib/lovable/backoffice"
import { euro } from "./dashboard-shared"
export function useDashboardPageModel() {
  const { orders, paused, setPaused } = useBackoffice()
  const revenue = orders
    .filter((o) => o.paid)
    .reduce((sum, o) => sum + o.total, 0)
  const active = orders.filter((o) => o.status !== "collected")
  const late = active.filter((o) => o.placedMin > 12)
  const unpaid = orders.filter((o) => !o.paid)
  const metrics = [
    {
      label: "Paid order value",
      value: euro(revenue),
      note: `${orders.filter((o) => o.paid).length} paid sample orders`,
      icon: Wallet,
    },
    {
      label: "Active orders",
      value: String(active.length).padStart(2, "0"),
      note: `${orders.filter((o) => o.status === "new").length} waiting to be accepted`,
      icon: ShoppingBag,
    },
    {
      label: "Average basket",
      value: euro(
        orders.reduce((sum, o) => sum + o.total, 0) / Math.max(orders.length, 1)
      ),
      note: `Across ${orders.length} sample orders`,
      icon: Utensils,
    },
    {
      label: "Needs attention",
      value: String(late.length + unpaid.length).padStart(2, "0"),
      note: `${late.length} late · ${unpaid.length} unpaid`,
      icon: CircleAlert,
    },
  ]

  return { orders, paused, setPaused, revenue, active, late, unpaid, metrics }
}
