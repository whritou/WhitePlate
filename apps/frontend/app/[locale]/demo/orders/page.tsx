import { Suspense } from "react"
import { OrdersPage } from "@/components/demo/workspace/orders/page"
export default function Page() {
  return (
    <Suspense>
      <OrdersPage />
    </Suspense>
  )
}
