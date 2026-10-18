import { WorkspacePageSkeleton } from "@/components/workspace/shared/workspace-page-skeletons"
import { getTranslations } from "next-intl/server"

export default async function OrganizationSignUpLoading() {
  const t = await getTranslations("WorkspaceLoading")

  return (
    <WorkspacePageSkeleton
      page="organizationSignUp"
      label={t("organizationSignUp")}
    />
  )
}
