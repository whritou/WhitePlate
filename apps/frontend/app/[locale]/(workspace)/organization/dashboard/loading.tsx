import { WorkspacePageSkeleton } from "@/components/workspace/shared/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function DashboardLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return <WorkspacePageSkeleton page="dashboard" label={t("workspace")} />
}
