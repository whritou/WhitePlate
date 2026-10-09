"use client"
import { Copy } from "@/components/lovable/copy"
import { SourceLabel } from "@/components/ui/lovable-controls"
import type { State } from "@/types/lovable/page-settings"
export type { Restaurant, State, Section } from "@/types/lovable/page-settings"
export const KEY = "whiteplate-lovable-demo-settings-v1"
export const DEFAULT: State = {
  org: {
    name: "Groupe Maison Verte",
    legal: "Maison Verte SAS",
    vat: "FR12 845 221 903",
    siret: "845 221 903 00018",
    email: "billing@maisonverte.fr",
    address: "12 rue de la Roquette, 75011 Paris",
    currency: "EUR",
    timezone: "Europe/Paris",
  },
  restaurants: [
    {
      id: "r1",
      name: "Maison Verte — Bastille",
      address: "12 rue de la Roquette, 75011 Paris",
      phone: "+33 1 43 00 00 01",
      status: "open",
      prep: 15,
      hours: "11:30–14:30 · 18:30–22:30",
    },
    {
      id: "r2",
      name: "Burger Maison — Oberkampf",
      address: "48 rue Oberkampf, 75011 Paris",
      phone: "+33 1 43 00 00 02",
      status: "open",
      prep: 12,
      hours: "12:00–23:00",
    },
    {
      id: "r3",
      name: "Maison Verte — Batignolles",
      address: "5 rue des Dames, 75017 Paris",
      phone: "+33 1 43 00 00 03",
      status: "paused",
      prep: 20,
      hours: "11:30–15:00 · 18:30–22:00",
    },
  ],
  stripe: true,
  plan: "pro",
  annual: true,
  domains: [
    { host: "order.maisonverte.fr", status: "pending" },
    { host: "burgermaison.fr", status: "pending" },
  ],
  notif: {
    newOrder: true,
    lateOrder: true,
    dailyReport: true,
    weeklyReport: false,
    payout: true,
    staffJoin: false,
  },
}
export const PLANS = {
  starter: { name: "Starter", m: 29, sites: 1 },
  pro: { name: "Pro", m: 79, sites: 5 },
  scale: { name: "Scale", m: 199, sites: 99 },
} as const
export const SECTIONS = [
  ["org", "Organization", "Company & legal"],
  ["restaurants", "Restaurants", "Locations & hours"],
  ["payments", "Payments", "Stripe · 0% fee"],
  ["billing", "Plan & billing", "Subscription, invoices"],
  ["domains", "Domains", "Custom DNS"],
  ["notifications", "Notifications", "Alerts & reports"],
  ["danger", "Danger zone", "Transfer, delete"],
] as const
export const input =
  "w-full border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
export function Card({
  title,
  sub,
  action,
  children,
}: {
  title: string
  sub?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="border bg-card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">
            <Copy>{title}</Copy>
          </h2>

          <Copy>
            {sub && (
              <p className="text-sm text-muted-foreground">
                <Copy>{sub}</Copy>
              </p>
            )}
          </Copy>
        </div>

        <Copy>{action}</Copy>
      </div>

      <Copy>{children}</Copy>
    </section>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <SourceLabel className="grid gap-1">
      <span className="label-mono text-muted-foreground">
        <Copy>{label}</Copy>
      </span>

      <Copy>{children}</Copy>
    </SourceLabel>
  )
}

export function Badge({ s }: { s: string }) {
  const good = ["open", "verified", "paid"].includes(s)

  return (
    <span
      className={`label-mono px-2 py-0.5 ${good ? "bg-primary text-primary-foreground" : s === "archived" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"}`}
    >
      <Copy>{s}</Copy>
    </span>
  )
}
