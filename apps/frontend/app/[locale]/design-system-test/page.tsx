import { DesignSystemTestHarness } from "@/components/ui/design-system-test-harness"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default function DesignSystemTestPage() {
  if (process.env.NODE_ENV !== "development") notFound()

  return <DesignSystemTestHarness />
}
