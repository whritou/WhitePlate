import { Suspense } from "react"
import { MenuPage } from "@/components/lovable/pages/menu"
export default function Page() {
  return (
    <Suspense>
      <MenuPage />
    </Suspense>
  )
}
