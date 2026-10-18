import { Suspense } from "react"
import { MenuPage } from "@/components/demo/workspace/menu/page"
export default function Page() {
  return (
    <Suspense>
      <MenuPage />
    </Suspense>
  )
}
