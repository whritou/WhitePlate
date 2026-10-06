import { WorkspacePageSkeleton } from "@/components/organization/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function TeamLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return <WorkspacePageSkeleton page="team" label={t("team")} />
}
