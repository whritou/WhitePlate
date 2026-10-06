"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { deactivateDiscountAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
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
  const { pending, state, submit } = useCatalogForm(deactivateDiscountAction)

  if (!confirming)
    return (
      <Button
        variant="outline"
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={t("deactivateDiscount", { code })}
      >
        {t("deactivate")}
      </Button>
    )

  return (
    <form
      onSubmit={submit}
      aria-label={t("deactivateDiscount", { code })}
      className="grid gap-3"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={id} />

      <p className="text-sm">{t("confirmDiscountDeactivation", { code })}</p>

      <fieldset disabled={pending} className="flex flex-wrap gap-3">
        <Button type="submit" variant="destructive">
          {pending ? t("saving") : t("confirmDeactivation")}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(false)}
        >
          {t("cancel")}
        </Button>
      </fieldset>

      <ResultMessage
        state={state}
        message={
          state.status === "success"
            ? t("discountDeactivated")
            : t(`errors.${state.error ?? "unavailable"}`)
        }
      />
    </form>
  )
}
