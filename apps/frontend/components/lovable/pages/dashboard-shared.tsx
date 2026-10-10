"use client"
import { type Status } from "@/lib/lovable/backoffice"
export const burger = "/lovable/store/burger.jpg"
export const bowl = "/lovable/store/bowl.jpg"
export const euro = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(
    n
  )
export const stages: { status: Status; name: string; tone: string }[] = [
  { status: "new", name: "New", tone: "bg-accent" },
  {
    status: "preparing",
    name: "Preparing",
    tone: "bg-primary text-primary-foreground",
  },
  { status: "ready", name: "Ready", tone: "bg-foreground text-background" },
  { status: "collected", name: "Collected", tone: "bg-secondary" },
]
