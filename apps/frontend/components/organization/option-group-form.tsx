"use client"

import { useTranslations } from "next-intl"
import { saveOptionGroupAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCatalogForm } from "./use-catalog-form"
import type { OptionGroupFormProps } from "@/types/catalog-management"

export function OptionGroupForm({
  tenantId,
  productId,
  productName,
  group,
}: OptionGroupFormProps) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    saveOptionGroupAction,
    !group
  )
  const prefix = group?.id ?? productId

  return (
    <form
      onSubmit={submit}
      aria-label={
        group
          ? t("editOptionGroup", { name: group.name })
          : t("newOptionGroupFor", { name: productName })
      }
      className="grid gap-3"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="productId" value={productId} />

      {group && <input type="hidden" name="id" value={group.id} />}

      <fieldset disabled={pending} className="grid gap-3 sm:grid-cols-2">
        <Label htmlFor={`${prefix}-group-name`} className="grid gap-2">
          {t("name")}

          <Input
            id={`${prefix}-group-name`}
            name="name"
            defaultValue={group?.name}
            autoComplete="off"
            required
            maxLength={120}
          />
        </Label>

        <Label htmlFor={`${prefix}-minimum-selections`} className="grid gap-2">
          {t("minimumSelections")}

          <Input
            id={`${prefix}-minimum-selections`}
            name="minimumSelections"
            type="number"
            min={0}
            max={20}
            step={1}
            aria-describedby={`${prefix}-selection-bounds-hint`}
            defaultValue={group?.minimumSelections ?? 0}
            autoComplete="off"
            required
          />
        </Label>

        <Label htmlFor={`${prefix}-maximum-selections`} className="grid gap-2">
          {t("maximumSelections")}

          <Input
            id={`${prefix}-maximum-selections`}
            name="maximumSelections"
            type="number"
            min={1}
            max={20}
            step={1}
            aria-describedby={`${prefix}-selection-bounds-hint`}
            defaultValue={group?.maximumSelections ?? 1}
            autoComplete="off"
            required
          />
        </Label>

        <Label htmlFor={`${prefix}-group-sort`} className="grid gap-2">
          {t("sortOrder")}

          <Input
            id={`${prefix}-group-sort`}
            name="sortOrder"
            type="number"
            min={0}
            max={2147483647}
            step={1}
            defaultValue={group?.sortOrder ?? 0}
            autoComplete="off"
            required
          />
        </Label>

        <p
          id={`${prefix}-selection-bounds-hint`}
          className="text-sm text-muted-foreground sm:col-span-2"
        >
          {t("selectionBoundsHint")}
        </p>

        <Button type="submit">
          {pending ? t("saving") : group ? t("save") : t("createOptionGroup")}
        </Button>
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
