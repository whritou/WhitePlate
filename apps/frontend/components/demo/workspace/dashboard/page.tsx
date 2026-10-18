"use client"
import { useDashboardPageModel } from "./model"
import { DashboardPageProvider } from "./context"
import { DashboardPageView } from "./view"
export function DashboardPage() {
  const model = useDashboardPageModel()

  return (
    <DashboardPageProvider model={model}>
      <DashboardPageView />
    </DashboardPageProvider>
  )
}

export { burger, bowl, euro, stages } from "./shared"
