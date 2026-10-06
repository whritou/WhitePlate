"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { saveDiscountAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useCatalogForm } from "./use-catalog-form"
import type {
  CatalogDiscount,
  DiscountFormProps,
} from "@/types/catalog-management"

export function DiscountForm({
  tenantId,
  currency,
  discount,
}: DiscountFormProps) {
  const t = useTranslations("Catalog")
  const [kind, setKind] = useState<CatalogDiscount["kind"]>(
    discount?.kind ?? "FixedAmount"
  )
  const { pending, state, submit } = useCatalogForm(
    saveDiscountAction,
    !discount
  )
  const prefix = discount?.id ?? "new-discount"
  const valueMaximum = kind === "Percentage" ? 100 : 9999999999.99

  let feedback = t("saving")

  if (state.status === "error" && !discount && state.error === "conflict")
    feedback = t("duplicateDiscountCode")
  else if (state.status === "error")
    feedback = t(`errors.${state.error ?? "unavailable"}`)

  return (
    <form
      onSubmit={submit}
      onReset={() => !discount && setKind("FixedAmount")}
      autoComplete="off"
      aria-label={
        discount
          ? t("editDiscount", { code: discount.code })
          : t("newDiscountCode")
      }
      className="grid gap-3"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      {discount && <input type="hidden" name="id" value={discount.id} />}

      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {!discount && (
          <Label htmlFor={`${prefix}-code`} className="grid gap-2">
            {t("discountCode")}

            <Input
              id={`${prefix}-code`}
              name="code"
              required
              minLength={1}
              maxLength={32}
              pattern="[A-Za-z0-9-]+"
              autoCapitalize="characters"
              spellCheck={false}
            />

            <span className="text-sm text-muted-foreground">
              {t("discountCodeHint")}
            </span>
          </Label>
        )}

        <Label htmlFor={`${prefix}-name`} className="grid gap-2">
          {t("name")}

          <Input
            id={`${prefix}-name`}
            name="name"
            defaultValue={discount?.name}
            required
            maxLength={120}
          />
        </Label>

        <Label htmlFor={`${prefix}-kind`} className="grid gap-2">
          {t("discountType")}

          <NativeSelect
            id={`${prefix}-kind`}
            name="kind"
            value={kind}
            onChange={(event) =>
              setKind(event.currentTarget.value as CatalogDiscount["kind"])
            }
            className="w-full"
            selectClassName="w-full"
            required
          >
            <NativeSelectOption value="FixedAmount">
              {t("fixedAmount")}
            </NativeSelectOption>

            <NativeSelectOption value="Percentage">
              {t("percentage")}
            </NativeSelectOption>
          </NativeSelect>
        </Label>

        <Label htmlFor={`${prefix}-value`} className="grid gap-2">
          {t(kind === "Percentage" ? "percentageValue" : "fixedValue", {
            currency,
          })}

          <Input
            id={`${prefix}-value`}
            name="value"
            type="number"
            min="0.01"
            max={valueMaximum}
            step="0.01"
            defaultValue={discount?.value}
            required
          />
        </Label>

        <Button type="submit">
          {pending ? t("saving") : discount ? t("save") : t("createDiscount")}
        </Button>
      </fieldset>

      <ResultMessage state={state} message={feedback} hideSuccess />
    </form>
  )
}
