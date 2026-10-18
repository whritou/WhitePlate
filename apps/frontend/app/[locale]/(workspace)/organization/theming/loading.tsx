import { WorkspacePageSkeleton } from "@/components/workspace/shared/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function ThemingLoading() {
  const t = await getTranslations("BrandAssets")

  return <WorkspacePageSkeleton page="theming" label={t("loading")} />
}
