import { WorkspacePageSkeleton } from "@/components/workspace/shared/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function AnalyticsLoading() {
  const t = await getTranslations("LiveWorkspace")

  return <WorkspacePageSkeleton page="analytics" label={t("metricsLoading")} />
}
