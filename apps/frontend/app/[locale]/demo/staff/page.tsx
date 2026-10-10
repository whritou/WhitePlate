import { Suspense } from "react"
import { StaffPage } from "@/components/lovable/pages/staff"
export default function Page() {
  return (
    <Suspense>
      <StaffPage />
    </Suspense>
  )
}
