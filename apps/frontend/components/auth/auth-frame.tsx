"use client"

import { Card } from "@/components/ui/card"
import { UtensilsCrossed } from "lucide-react"

export function AuthFrame({
  children,
  aside,
}: {
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background px-5 py-10 sm:px-8 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(24rem,28rem)] lg:items-center lg:gap-16 lg:px-16 lg:py-14">
      <section className="mx-auto w-full max-w-[27rem] lg:order-2">
        {children}
      </section>

      <aside className="mx-auto mt-10 hidden w-full max-w-2xl lg:order-1 lg:block">
        <Card className="relative gap-0 overflow-hidden rounded-2xl border border-border bg-secondary px-10 py-12 xl:px-14 xl:py-16">
          <div
            className="absolute -top-16 -right-16 h-64 w-64 rounded-full border-[36px] border-primary/10"
            aria-hidden="true"
          />

          <UtensilsCrossed
            className="mb-8 size-7 text-primary"
            aria-hidden="true"
          />

          {aside}
        </Card>
      </aside>
    </main>
  )
}
