import { WorkspaceLoadingSkeleton } from "@/components/organization/workspace-loading-skeleton"
import { getTranslations } from "next-intl/server"
export default async function DashboardLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return <WorkspaceLoadingSkeleton label={t("workspace")} />
}
