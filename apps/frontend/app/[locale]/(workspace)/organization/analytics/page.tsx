import { getLocale, getTranslations } from "next-intl/server"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { getDashboardMetrics } from "@/services/orders"
import { DashboardMetricsPanel } from "@/components/organization/dashboard-metrics-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"
export default async function AnalyticsWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const restaurant = await getManagedWorkspaceRestaurant(params.tenantId)
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("LiveWorkspace"),
  ])

  if (!restaurant)
    return (
      <main className="live-page">
        <h1 className="mb-6 text-3xl font-bold">{t("analytics")}</h1>

        <Alert variant="destructive">
          <AlertDescription>{t("loadError")}</AlertDescription>
        </Alert>
      </main>
    )

  const metricsResponse = await getDashboardMetrics(restaurant.id)

  return (
    <main className="mx-auto max-w-[1600px] min-w-0 px-6 pb-12">
      <header className="py-8">
        <p className="label-mono text-muted-foreground">{restaurant.name}</p>

        <h1 className="mt-2 font-display text-4xl font-bold">
          {t("analytics")}
        </h1>
      </header>

      <DashboardMetricsPanel
        userId={restaurant.userId}
        tenantId={restaurant.id}
        locale={locale}
        role={restaurant.role}
        initialMetrics={
          metricsResponse.ok ? (metricsResponse.data ?? null) : null
        }
      />
    </main>
  )
}
