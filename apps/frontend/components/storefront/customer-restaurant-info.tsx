"use client"
import type { ReactNode } from "react"
import { Copy } from "@/components/shared/translated-copy"

export function CustomerRestaurantInfo({
  items,
  label,
}: {
  items: { label: string; content: ReactNode }[]
  label?: string
}) {
  const line = "color-mix(in oklab, var(--foreground) 12%, transparent)"

  return (
    <section
      aria-label={label}
      className="grid gap-px sm:grid-cols-3"
      style={{ background: line, borderBottom: `1px solid ${line}` }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="px-6 py-3"
          style={{ background: "var(--background)" }}
        >
          <p
            className="text-xs font-bold tracking-wider uppercase"
            style={{
              color: "color-mix(in oklab, var(--foreground) 60%, transparent)",
            }}
          >
            <Copy>{item.label}</Copy>
          </p>

          <p className="text-sm font-semibold">
            <Copy>{item.content}</Copy>
          </p>
        </div>
      ))}
    </section>
  )
}
