import { WorkspaceToastTestHarness } from "@/components/ui/workspace-toast-test-harness"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default function WorkspaceToastTestPage() {
  if (process.env.NODE_ENV !== "development") notFound()

  return (
    <main className="mx-auto grid min-h-screen max-w-xl content-center gap-4 p-6">
      <h1 className="text-xl font-semibold">Workspace toast test harness</h1>

      <WorkspaceToastTestHarness />
    </main>
  )
}
