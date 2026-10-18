import { Suspense } from "react"
import { StorePage } from "@/components/storefront/demo/pages/store"
export default function Page() {
  return (
    <Suspense>
      <StorePage />
    </Suspense>
  )
}
