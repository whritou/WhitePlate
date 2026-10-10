"use client"
import { useDashboardPageModel } from "./dashboard-DashboardPage-model"
import { DashboardPageProvider } from "./dashboard-DashboardPage-context"
import { DashboardPageView } from "./dashboard-DashboardPage-view"
export function DashboardPage() {
  const model = useDashboardPageModel()

  return (
    <DashboardPageProvider model={model}>
      <DashboardPageView />
    </DashboardPageProvider>
  )
}

export { burger, bowl, euro, stages } from "./dashboard-shared"
