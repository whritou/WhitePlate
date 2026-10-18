import { WorkspacePageSkeleton } from "@/components/organization/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function RestaurantSettingsLoading() {
  const t = await getTranslations("EstablishmentSettings")

  return (
    <WorkspacePageSkeleton
      page="restaurantSettings"
      label={t("loading")}
    />
  )
}
