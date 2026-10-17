import { getTranslations } from "next-intl/server"
import { getManagedWorkspaceRestaurant } from "@/services/live-workspace"
import { RestaurantSettings } from "@/components/organization/restaurant-settings"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SearchParams } from "@/types/navigation"
import {
  getEstablishmentSettings,
  getTenantLegalProfile,
} from "@/services/establishment-settings"
import { getOrderEmailSettings } from "@/services/order-email-settings"
import { getStripeConnectStatus } from "@/services/stripe-connect"

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

  const section =
    typeof params.section === "string" &&
    ["establishment", "legal", "hours", "pickup", "notifications", "payments"].includes(params.section)
      ? (params.section as
          | "establishment"
          | "legal"
          | "hours"
          | "pickup"
          | "notifications"
          | "payments")
      : "establishment"
  const [settings, legalProfile, emailSettings, stripeStatus] = await Promise.all([
    getEstablishmentSettings(restaurant.id),
    getTenantLegalProfile(restaurant.id),
    getOrderEmailSettings(restaurant.id),
    section === "payments"
      ? getStripeConnectStatus(restaurant.id)
      : Promise.resolve(null),
  ])
  const callbackOutcome =
    typeof params.stripeConnectResult === "string"
      ? params.stripeConnectResult
      : undefined

  return (
    <RestaurantSettings
      restaurant={restaurant}
      userId={restaurant.userId}
      initial={settings.ok ? settings.data : null}
      legalProfile={legalProfile.ok ? legalProfile.data : null}
      emailSettings={emailSettings.ok ? emailSettings.data : null}
      section={section}
      stripeConnectStatus={stripeStatus?.ok ? stripeStatus.data : null}
      stripeConnectCallbackOutcome={callbackOutcome}
    />
  )
}
