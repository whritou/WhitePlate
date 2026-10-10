import { Suspense } from "react"
import { HistoryPage } from "@/components/lovable/pages/history"
export default function Page() {
  return (
    <Suspense>
      <HistoryPage />
    </Suspense>
  )
}
