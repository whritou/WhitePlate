import { WorkspacePageSkeleton } from "@/components/organization/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function MenuLanguagesLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return (
    <WorkspacePageSkeleton page="menuLanguages" label={t("menuLanguages")} />
  )
}
