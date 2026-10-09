import { Suspense } from "react"
import { TrackingPage } from "@/components/lovable/pages/tracking"
export default function Page() {
  return (
    <Suspense>
      <TrackingPage />
    </Suspense>
  )
}
