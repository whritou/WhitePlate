"use client"

import { useTranslations } from "next-intl"
import { saveOptionAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { EditorFormActions } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCatalogForm } from "./use-catalog-form"
import type { OptionFormProps } from "@/types/catalog-management"

export function OptionForm({
  tenantId,
  currency,
  group,
  option,
  onSuccess,
  onPendingChange,
  onCancel,
}: OptionFormProps) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    saveOptionAction,
    !option,
    onSuccess,
    undefined,
    onPendingChange
  )
  const prefix = option?.id ?? `new-option-${group.id}`

  return (
    <form
      onSubmit={submit}
      aria-label={
        option
          ? t("editOption", { name: option.name })
          : t("newOptionFor", { name: group.name })
      }
      className="grid gap-3"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="groupId" value={group.id} />

      {option && <input type="hidden" name="id" value={option.id} />}

      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
        <Label htmlFor={`${prefix}-option-name`} className="grid gap-2">
          {t("name")}

          <Input
            id={`${prefix}-option-name`}
            name="name"
            defaultValue={option?.name}
            autoComplete="off"
            required
            maxLength={120}
          />
        </Label>

        <Label htmlFor={`${prefix}-price-adjustment`} className="grid gap-2">
          {t("priceAdjustment", { currency })}

          <Input
            id={`${prefix}-price-adjustment`}
            name="priceAdjustment"
            type="number"
            min={0}
            max={9999999999.99}
            step="0.01"
            defaultValue={option?.priceAdjustment.toFixed(2) ?? "0.00"}
            autoComplete="off"
            required
          />
        </Label>

        <Label htmlFor={`${prefix}-option-sort`} className="grid gap-2">
          {t("sortOrder")}

          <Input
            id={`${prefix}-option-sort`}
            name="sortOrder"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            defaultValue={option?.sortOrder ?? 0}
            autoComplete="off"
            required
          />
        </Label>

        <EditorFormActions
          pending={pending}
          onCancel={onCancel}
          label={pending ? t("saving") : option ? t("save") : t("createOption")}
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
