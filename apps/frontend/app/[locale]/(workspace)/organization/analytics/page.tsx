import { getTranslations } from "next-intl/server"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { AnalyticsPage } from "@/components/lovable/pages/analytics"
import { MissingFeatureNotice } from "@/components/organization/missing-feature-notice"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"
export default async function AnalyticsWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const restaurant = await getManagedWorkspaceRestaurant(
    (await searchParams).tenantId
  )
  const t = await getTranslations("LiveWorkspace")

  if (!restaurant)
    return (
      <main className="live-page">
        <h1 className="mb-6 text-3xl font-bold">{t("analytics")}</h1>

        <Alert variant="destructive">
          <AlertDescription>{t("loadError")}</AlertDescription>
        </Alert>
      </main>
    )

  return (
    <div className="min-w-0">
      <div className="grid gap-3 px-6 pt-6">
        <MissingFeatureNotice />

        <p className="text-sm text-muted-foreground">
          {restaurant.name} · {t("sampleAnalytics")}
        </p>
      </div>

      <AnalyticsPage />
    </div>
  )
}
