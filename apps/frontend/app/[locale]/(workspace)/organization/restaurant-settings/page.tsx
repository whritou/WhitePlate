import { getTranslations } from "next-intl/server"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { RestaurantSettings } from "@/components/organization/restaurant-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"
import {
  getEstablishmentSettings,
  getTenantLegalProfile,
} from "@/services/establishment-settings"

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

  const [settings, legalProfile] = await Promise.all([
    getEstablishmentSettings(restaurant.id),
    getTenantLegalProfile(restaurant.id),
  ])
  const section =
    typeof params.section === "string" &&
    ["establishment", "legal", "hours", "pickup"].includes(params.section)
      ? (params.section as "establishment" | "legal" | "hours" | "pickup")
      : "establishment"

  return (
    <RestaurantSettings
      restaurant={restaurant}
      userId={restaurant.userId}
      initial={settings.ok ? settings.data : null}
      legalProfile={legalProfile.ok ? legalProfile.data : null}
      section={section}
    />
  )
}
