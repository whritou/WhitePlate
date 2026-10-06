"use client"

import { Button } from "@/components/ui/button"
import { useWorkspaceToast } from "@/components/ui/toast"
import { useTranslations } from "next-intl"

export function WorkspaceToastTestHarness() {
  const t = useTranslations("WorkspaceToastTest")
  const toast = useWorkspaceToast()

  return (
    <Button type="button" onClick={() => toast.success(t("successMessage"))}>
      {t("showSuccess")}
    </Button>
  )
}
