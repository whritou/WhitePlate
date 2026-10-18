import { Suspense } from "react"
import { DashboardPage } from "@/components/demo/workspace/dashboard/page"
export default function Page() {
  return (
    <Suspense>
      <DashboardPage />
    </Suspense>
  )
}
