import { Suspense } from "react"
import { DashboardPage } from "@/components/lovable/pages/dashboard"
export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  )
}
