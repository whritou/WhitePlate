import { Suspense } from "react"
import { StorePage } from "@/components/lovable/pages/store"
export default function Page() {
  return (
    <Suspense>
      <StorePage />
    </Suspense>
  )
}
