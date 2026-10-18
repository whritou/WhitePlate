import { Suspense } from "react"
import { StudioPage } from "@/components/demo/workspace/studio/page"
export default function Page() {
  return (
    <Suspense>
      <StudioPage />
    </Suspense>
  )
}
