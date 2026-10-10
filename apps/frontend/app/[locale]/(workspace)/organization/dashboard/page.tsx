import { getLocale, getTranslations } from "next-intl/server"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { getOrderPage } from "@/services/orders"
import { LiveDashboard } from "@/components/organization/live-dashboard"
import { MenuBuilderRetry } from "@/components/organization/menu-builder-retry"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const query = await searchParams
  const restaurant = await getManagedWorkspaceRestaurant(query.tenantId)
  const response = restaurant
    ? await getOrderPage(restaurant.id, null, null)
    : null
  const t = await getTranslations("LiveWorkspace")

  if (!restaurant || !response?.ok || !response.data)
    return (
      <main className="live-page">
        <h1 className="mb-6 text-3xl font-bold">{t("dashboard")}</h1>

        <Alert variant="destructive">
          <AlertDescription>{t("loadError")}</AlertDescription>
        </Alert>

        <MenuBuilderRetry />
      </main>
    )

  return (
    <LiveDashboard
      name={restaurant.name}
      tenantId={restaurant.id}
      page={response.data}
      locale={await getLocale()}
    />
  )
}
