import { Suspense } from "react"
import { CheckoutPage } from "@/components/lovable/pages/checkout"
export default function Page() {
  return (
    <Suspense>
      <CheckoutPage />
    </Suspense>
  )
}
