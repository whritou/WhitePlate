import { Suspense } from "react"
import { CheckoutPage } from "@/components/storefront/demo/pages/checkout"
export default function Page() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  )
}
