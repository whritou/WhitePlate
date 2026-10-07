import { WorkspacePageSkeleton } from "@/components/organization/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function OrderHistoryLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return <WorkspacePageSkeleton page="orderHistory" label={t("orderHistory")} />
}
