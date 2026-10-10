"use client"
import { Copy } from "@/components/lovable/copy"
import { Utensils, Palette, ListOrdered } from "lucide-react"
export function LandingSection3() {
  return (
    <section className="border-b bg-muted">
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-7 sm:grid-cols-3">
        <Copy>
          {[
            {
              icon: Utensils,
              title: "A menu with all the details",
              sub: "Photos, options, allergens & translations",
            },
            {
              icon: Palette,
              title: "One brand across every page",
              sub: "Store, checkout & order tracking",
            },
            {
              icon: ListOrdered,
              title: "A complete service workspace",
              sub: "Orders, history, team & analytics",
            },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" />

              <div>
                <p className="text-sm font-semibold">
                  <Copy>{title}</Copy>
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  <Copy>{sub}</Copy>
                </p>
              </div>
            </div>
          ))}
        </Copy>
      </div>
    </section>
  )
}
