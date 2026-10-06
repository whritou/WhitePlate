"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { deactivateDiscountAction } from "@/actions/catalog"
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
import type { DiscountReferenceInput } from "@/types/catalog-management"

export function DeactivateDiscountButton({
  tenantId,
  id,
  code,
}: DiscountReferenceInput & { code: string }) {
  const t = useTranslations("Catalog")
  const [confirming, setConfirming] = useState(false)
  const { pending, state, submit } = useCatalogForm(
    deactivateDiscountAction,
    false,
    () => setConfirming(false),
    t("discountDeactivated")
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
        aria-label={t("deactivateDiscount", { code })}
      >
        {t("deactivate")}
      </AlertDialogTrigger>

      <AlertDialogPortal>
        <AlertDialogBackdrop />

        <AlertDialogPopup>
          <div className="grid gap-1">
            <AlertDialogTitle>
              {t("deactivateDialogTitle", { code })}
            </AlertDialogTitle>

            <AlertDialogDescription>
              {t("confirmDiscountDeactivation", { code })}
            </AlertDialogDescription>
          </div>

          <form
            onSubmit={submit}
            aria-label={t("deactivateDiscount", { code })}
            className="grid gap-4"
          >
            <input type="hidden" name="tenantId" value={tenantId} />

            <input type="hidden" name="id" value={id} />

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
                {submitting ? t("deactivating") : t("confirmDeactivation")}
              </Button>
            </div>

            <ResultMessage
              state={state}
              hideSuccess
              message={
                state.status === "success"
                  ? t("discountDeactivated")
                  : t(`errors.${state.error ?? "unavailable"}`)
              }
            />
          </form>
        </AlertDialogPopup>
      </AlertDialogPortal>
    </AlertDialog>
  )
}
