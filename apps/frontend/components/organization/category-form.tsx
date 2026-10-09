"use client"

import { useTranslations } from "next-intl"
import { saveCategoryAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { EditorFormActions } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCatalogForm } from "./use-catalog-form"
import type { CategoryFormProps } from "@/types/catalog-management"

export function CategoryForm({
  tenantId,
  category,
  onSuccess,
  onPendingChange,
  onCancel,
  onCreated,
}: CategoryFormProps) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    saveCategoryAction,
    !category,
    (result) => {
      if (result.category) onCreated?.(result.category)
      onSuccess?.()
    },
    undefined,
    onPendingChange
  )
  const prefix = category?.id ?? "new-category"

  return (
    <form
      onSubmit={submit}
      aria-label={
        category ? t("editCategory", { name: category.name }) : t("newCategory")
      }
      className="grid gap-4"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      {category && <input type="hidden" name="id" value={category.id} />}

      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <Label htmlFor={`${prefix}-name`} className="grid gap-2">
          {t("name")}

          <Input
            id={`${prefix}-name`}
            name="name"
            defaultValue={category?.name}
            required
            maxLength={120}
          />
        </Label>

        <Label htmlFor={`${prefix}-sort`} className="grid gap-2">
          {t("sortOrder")}

          <Input
            id={`${prefix}-sort`}
            name="sortOrder"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            defaultValue={category?.sortOrder ?? 0}
            required
          />
        </Label>

        <EditorFormActions
          pending={pending}
          onCancel={onCancel}
          label={
            pending ? t("saving") : category ? t("save") : t("createCategory")
          }
        />
      </fieldset>

      <ResultMessage
        state={state}
        hideSuccess
        message={
          state.status === "success"
            ? t("saved")
            : t(`errors.${state.error ?? "unavailable"}`)
        }
      />
    </form>
  )
}
