"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function RoleArchiveDialog({
  open,
  archiving,
  error,
  roleName,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  archiving: boolean
  error: boolean
  roleName: string
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const t = useTranslations("RolePermissions")

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogPortal>
        <AlertDialogBackdrop />

        <AlertDialogPopup>
          <div className="grid gap-1">
            <AlertDialogTitle>{t("archiveDialogTitle")}</AlertDialogTitle>

            <AlertDialogDescription>
              {t("archiveDialogDescription", { role: roleName })}
            </AlertDialogDescription>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t("archiveError")}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogClose
              disabled={archiving}
              render={<Button type="button" variant="outline" />}
            >
              {t("cancel")}
            </AlertDialogClose>

            <Button
              type="button"
              variant="destructive"
              disabled={!open || archiving}
              onClick={onConfirm}
            >
              {archiving ? t("archiving") : t("confirmArchive")}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
