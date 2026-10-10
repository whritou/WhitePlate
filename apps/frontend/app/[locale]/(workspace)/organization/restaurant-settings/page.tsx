import { getTranslations } from "next-intl/server"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { RestaurantSettings } from "@/components/organization/restaurant-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"

export default async function RestaurantSettingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const restaurant = await getManagedWorkspaceRestaurant(params.tenantId)

  if (!restaurant) {
    const t = await getTranslations("LiveWorkspace")

    return (
      <main className="live-page">
        <Alert variant="destructive">
          <AlertDescription>{t("unavailable")}</AlertDescription>
        </Alert>
      </main>
    )
  }

  return <RestaurantSettings restaurant={restaurant} />
}
