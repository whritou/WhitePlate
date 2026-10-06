"use client"

import { Button } from "@/components/ui/button"
import { useWorkspaceToast } from "@/components/ui/toast"

export function WorkspaceToastTestHarness() {
  const toast = useWorkspaceToast()

  return (
    <Button type="button" onClick={() => toast.success("Changes saved.")}>
      Show success toast
    </Button>
  )
}
