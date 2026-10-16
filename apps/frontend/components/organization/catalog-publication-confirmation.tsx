"use client"

import { useTranslations } from "next-intl"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { PublicationConfirmAction } from "@/types/catalog-management"

export function CatalogPublicationConfirmation({
  action,
  changeCount,
  pending,
  working,
  onOpenChange,
  onConfirm,
}: {
  action: PublicationConfirmAction | null
  changeCount: number
  pending: boolean
  working: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const t = useTranslations("CatalogPublication")
  const title =
    action?.kind === "publish"
      ? t("confirmPublishTitle")
      : action?.kind === "discard"
        ? t("confirmDiscardTitle")
        : t("confirmRestoreTitle", {
            version: action?.kind === "restore" ? action.version : 0,
          })
  const description =
    action?.kind === "publish"
      ? t("confirmPublishDescription", { count: changeCount })
      : action?.kind === "discard"
        ? t("confirmDiscardDescription", { count: changeCount })
        : t("confirmRestoreDescription", {
            version: action?.kind === "restore" ? action.version : 0,
          })
  const confirmLabel =
    action?.kind === "publish"
      ? t("publish")
      : action?.kind === "discard"
        ? t("discard")
        : t("restore")

  return (
    <AlertDialog
      open={action !== null}
      onOpenChange={(open) => {
        if (!open && !working) onOpenChange(false)
      }}
    >
      <AlertDialogPortal>
        <AlertDialogBackdrop />

        <AlertDialogPopup>
          <div className="grid gap-1">
            <AlertDialogTitle>{title}</AlertDialogTitle>

            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogClose
              disabled={working}
              render={<Button type="button" variant="outline" />}
            >
              {t("cancel")}
            </AlertDialogClose>

            <Button
              type="button"
              variant={action?.kind === "discard" ? "destructive" : "default"}
              disabled={working || pending}
              onClick={onConfirm}
            >
              {working ? t("working") : confirmLabel}
            </Button>
          </div>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
