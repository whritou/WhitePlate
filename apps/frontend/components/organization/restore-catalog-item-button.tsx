"use client"

import { RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import { restoreCatalogItemAction } from "@/actions/catalog"
import { Button } from "@/components/ui/button"
import type { CatalogEntityType } from "@/types/catalog-management"
import { ResultMessage } from "@/components/auth/result-message"
import { useCatalogForm } from "./use-catalog-form"

export function RestoreCatalogItemButton({
  tenantId,
  id,
  entityType,
  name,
  compact = false,
  onPendingChange,
}: {
  tenantId: string
  id: string
  entityType: Exclude<CatalogEntityType, "products">
  name: string
  compact?: boolean
  onPendingChange?: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    restoreCatalogItemAction,
    false,
    undefined,
    t("restoredItem", { name }),
    onPendingChange
  )

  return (
    <form onSubmit={submit} className="grid justify-items-start gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={id} />

      <input type="hidden" name="entityType" value={entityType} />

      <Button
        type="submit"
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon" : "default"}
        disabled={pending}
        aria-label={t("restoreItem", { name })}
      >
        <RotateCcw aria-hidden="true" className="size-4" />

        <span className={compact ? "sr-only" : undefined}>
          {pending ? t("restoring") : t("restore")}
        </span>
      </Button>

      {!compact && (
        <ResultMessage
          state={state}
          hideSuccess
          message={
            state.status === "success"
              ? t("restoredItem", { name })
              : t(`errors.${state.error ?? "unavailable"}`)
          }
        />
      )}
    </form>
  )
}
