import { Suspense } from "react"
import { HistoryPage } from "@/components/demo/workspace/history/page"
export default function Page() {
  return (
    <Suspense>
      <HistoryPage />
    </Suspense>
  )
}
