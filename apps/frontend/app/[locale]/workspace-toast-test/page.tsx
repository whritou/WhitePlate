import { WorkspaceToastTestHarness } from "@/components/ui/workspace-toast-test-harness"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"

export const dynamic = "force-dynamic"

export default async function WorkspaceToastTestPage() {
  if (process.env.NODE_ENV !== "development") notFound()

  const t = await getTranslations("WorkspaceToastTest")

  return (
    <main className="mx-auto grid min-h-screen max-w-xl content-center gap-4 p-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>

      <WorkspaceToastTestHarness />
    </main>
  )
}
