"use client"

import { restoreProductAction } from "@/actions/catalog"
import { Button } from "@/components/ui/button"
import { useCatalogForm } from "./use-catalog-form"
import { ResultMessage } from "@/components/auth/result-message"
import { useTranslations } from "next-intl"

export function RestoreProductButton({
  tenantId,
  id,
}: {
  tenantId: string
  id: string
}) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    restoreProductAction,
    false,
    undefined,
    t("productRestored")
  )

  return (
    <form onSubmit={submit} className="grid justify-items-start gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={id} />

      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? t("restoringProduct") : t("restoreProduct")}
      </Button>

      <ResultMessage
        state={state}
        hideSuccess
        message={
          state.status === "success"
            ? t("productRestored")
            : t(`errors.${state.error ?? "unavailable"}`)
        }
      />
    </form>
  )
}
