import { Suspense } from "react"
import { SettingsPage } from "@/components/lovable/pages/settings"
export default function Page() {
  return (
    <Suspense>
      <SettingsPage />
    </Suspense>
  )
}
