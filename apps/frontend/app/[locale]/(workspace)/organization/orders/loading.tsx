import { WorkspacePageSkeleton } from "@/components/organization/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function OrdersLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return <WorkspacePageSkeleton page="orders" label={t("orders")} />
}
