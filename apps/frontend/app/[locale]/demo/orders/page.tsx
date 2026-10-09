import { Suspense } from "react"
import { OrdersPage } from "@/components/lovable/pages/orders"
export default function Page() {
  return (
    <Suspense>
      <OrdersPage />
    </Suspense>
  )
}
