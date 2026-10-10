"use client"
import { useSearchParams } from "next/navigation"
import { CustomerTracking } from "@/components/lovable/CustomerTracking"
import { useStoreTheme } from "@/hooks/lovable/use-store-theme"
import { useDemoDraft } from "@/hooks/lovable/use-demo-draft"
import { readCustomerOrder, PREVIEW_ORDER } from "@/lib/lovable/customerOrder"
import type { CustomerOrder } from "@/types/lovable/customerOrder"
export function TrackingPage() {
  const orderId = useSearchParams().get("orderId")
  const { theme } = useStoreTheme()
  const [order] = useDemoDraft<CustomerOrder | null>(PREVIEW_ORDER, () =>
    orderId ? readCustomerOrder(orderId) : PREVIEW_ORDER
  )

  return <CustomerTracking t={theme} order={order} preview={!orderId} />
}
