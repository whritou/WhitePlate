import { WorkspacePageSkeleton } from "@/components/organization/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function ThemingLoading() {
  const t = await getTranslations("BrandAssets")

  return <WorkspacePageSkeleton page="theming" label={t("loading")} />
}
