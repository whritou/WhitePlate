"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ORDER_STATUSES, parseOrderStatusFilter } from "@/lib/order-dashboard"
import type { OrderStatus } from "@/types/orders"

export function OrderStatusTabs({
  selectedStatus,
  onStatusChange,
  disabled,
  children,
}: {
  selectedStatus: OrderStatus | null
  onStatusChange: (status: OrderStatus | null) => void
  disabled?: boolean
  children: ReactNode
}) {
  const t = useTranslations("KitchenOrders")
  const value = selectedStatus ?? "all"

  return (
    <Tabs
      value={value}
      onValueChange={(value) => {
        const parsed = parseOrderStatusFilter(value)

        if (parsed.ok) onStatusChange(parsed.status)
      }}
    >
      <TabsList aria-label={t("filterLabel")}>
        {[null, ...ORDER_STATUSES].map((status) => (
          <TabsTrigger
            key={status ?? "all"}
            value={status ?? "all"}
            disabled={disabled}
          >
            {t(`statuses.${status ?? "all"}`)}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={value}>{children}</TabsContent>
    </Tabs>
  )
}
