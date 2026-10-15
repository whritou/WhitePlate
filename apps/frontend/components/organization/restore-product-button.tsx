"use client"

import { RotateCcw } from "lucide-react"

import { restoreProductAction } from "@/actions/catalog"
import { Button } from "@/components/ui/button"
import { useCatalogForm } from "./use-catalog-form"
import { ResultMessage } from "@/components/auth/result-message"
import { useTranslations } from "next-intl"

export function RestoreProductButton({
  tenantId,
  id,
  onPendingChange,
  onRestored,
  compact = false,
}: {
  tenantId: string
  id: string
  onPendingChange?: (pending: boolean) => void
  onRestored?: () => void
  compact?: boolean
}) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    restoreProductAction,
    false,
    onRestored,
    t("productRestored"),
    onPendingChange
  )

  return (
    <form onSubmit={submit} className="grid justify-items-start gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={id} />

      <Button
        type="submit"
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon" : "default"}
        disabled={pending}
        data-no-drag="true"
        aria-label={t("restoreProduct")}
      >
        <RotateCcw aria-hidden="true" className="size-4" />

        {!compact && (pending ? t("restoringProduct") : t("restoreProduct"))}
      </Button>

      {!compact && (
        <ResultMessage
          state={state}
          hideSuccess
          message={
            state.status === "success"
              ? t("productRestored")
              : t(`errors.${state.error ?? "unavailable"}`)
          }
        />
      )}
    </form>
  )
}
