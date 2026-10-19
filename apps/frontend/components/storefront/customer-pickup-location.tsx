"use client"

import type { ReactNode } from "react"
import { MapPin } from "lucide-react"
import { Copy } from "@/components/shared/translated-copy"

export function CustomerPickupLocation({
  name,
  orderId,
  children,
  actions,
}: {
  name: string
  orderId: string
  children: ReactNode
  actions?: ReactNode
}) {
  return (
    <section className="border-t pt-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <MapPin size={20} className="text-primary" />
        <Copy>Pickup location</Copy>
      </h2>

      <p className="font-semibold">
        <Copy>{name}</Copy>
      </p>

      {children}

      <p className="mt-4 text-sm">
        <Copy>Show </Copy>
        <strong>
          #<Copy>{orderId}</Copy>
        </strong>
        <Copy> at collection.</Copy>
      </p>

      {actions}
    </section>
  )
}
