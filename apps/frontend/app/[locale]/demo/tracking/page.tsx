import { Suspense } from "react"
import { TrackingPage } from "@/components/storefront/demo/pages/tracking"
export default function Page() {
  return (
    <Suspense>
      <TrackingPage />
    </Suspense>
  )
}
