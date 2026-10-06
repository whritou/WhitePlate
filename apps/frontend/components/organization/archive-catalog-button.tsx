"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { archiveCatalogItemAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
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
  const { pending, state, submit } = useCatalogForm(archiveCatalogItemAction)

  if (!confirming)
    return (
      <Button
        variant="outline"
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={t("archiveName", { name })}
      >
        {t("archive")}
      </Button>
    )

  return (
    <form
      onSubmit={submit}
      aria-label={t("archiveName", { name })}
      className="grid gap-3"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={id} />

      <input type="hidden" name="entityType" value={entityType} />

      <p className="text-sm">{t(confirmationMessages[entityType], { name })}</p>

      <fieldset disabled={pending} className="flex gap-3">
        <Button type="submit" variant="destructive">
          {pending ? t("saving") : t("confirmArchive")}
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
            ? t("archived")
            : t(`errors.${state.error ?? "unavailable"}`)
        }
      />
    </form>
  )
}
