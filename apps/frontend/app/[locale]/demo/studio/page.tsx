import { Suspense } from "react"
import { StudioPage } from "@/components/lovable/pages/studio"
export default function Page() {
  return (
    <Suspense>
      <StudioPage />
    </Suspense>
  )
}
