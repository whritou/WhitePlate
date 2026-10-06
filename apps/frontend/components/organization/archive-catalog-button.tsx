"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { archiveCatalogItemAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import {
  AlertDialog,
  AlertDialogBackdrop,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogPopup,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useCatalogForm } from "./use-catalog-form"
import type {
  ArchiveButtonProps,
  CatalogEntityType,
} from "@/types/catalog-management"

const confirmationMessages: Record<CatalogEntityType, string> = {
  categories: "confirmCategoryArchive",
  products: "confirmProductArchive",
  "option-groups": "confirmOptionGroupArchive",
  options: "confirmOptionArchive",
}

export function ArchiveCatalogButton({
  tenantId,
  id,
  entityType,
  name,
}: ArchiveButtonProps) {
  const t = useTranslations("Catalog")
  const [confirming, setConfirming] = useState(false)
  const { pending, state, submit } = useCatalogForm(
    archiveCatalogItemAction,
    false,
    () => setConfirming(false)
  )
  const submitting = pending || state.status === "pending"

  return (
    <AlertDialog
      open={confirming}
      onOpenChange={(open) => {
        if (!open && submitting) return

        setConfirming(open)
      }}
    >
      <AlertDialogTrigger
        disabled={submitting}
        render={<Button type="button" variant="outline" />}
        aria-label={t("archiveName", { name })}
      >
        {t("archive")}
      </AlertDialogTrigger>

      <AlertDialogPortal>
        <AlertDialogBackdrop />

        <AlertDialogPopup>
          <div className="grid gap-1">
            <AlertDialogTitle>
              {t("archiveDialogTitle", { name })}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {t(confirmationMessages[entityType], { name })}
            </AlertDialogDescription>
          </div>

          <form
            onSubmit={submit}
            aria-label={t("archiveName", { name })}
            className="grid gap-4"
          >
            <input type="hidden" name="tenantId" value={tenantId} />

            <input type="hidden" name="id" value={id} />

            <input type="hidden" name="entityType" value={entityType} />

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <AlertDialogClose
                disabled={submitting}
                render={
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                  />
                }
              >
                {t("cancel")}
              </AlertDialogClose>

              <Button
                type="submit"
                variant="destructive"
                disabled={submitting}
                className="w-full sm:w-auto"
              >
                {submitting ? t("archiving") : t("confirmArchive")}
              </Button>
            </div>

            <ResultMessage
              state={state}
              message={
                state.status === "success"
                  ? t("archived")
                  : t(`errors.${state.error ?? "unavailable"}`)
              }
            />
          </form>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
