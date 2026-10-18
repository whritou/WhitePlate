import { Suspense } from "react"
import { SettingsPage } from "@/components/demo/workspace/settings/page"
export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  )
}
