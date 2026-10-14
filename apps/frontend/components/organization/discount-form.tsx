"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { saveDiscountAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { EditorFormActions } from "@/components/ui/editor-dialog"
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
  onSuccess,
  onPendingChange,
  onCancel,
}: DiscountFormProps) {
  const t = useTranslations("Catalog")
  const [kind, setKind] = useState<CatalogDiscount["kind"]>(
    discount?.kind ?? "FixedAmount"
  )
  const { pending, state, submit } = useCatalogForm(
    saveDiscountAction,
    !discount,
    onSuccess,
    undefined,
    onPendingChange
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
          <div className="grid min-w-0 content-start gap-2">
            <Label
              htmlFor={`${prefix}-code`}
              className="flex min-h-11 items-end pb-1"
            >
              {t("discountCode")}
            </Label>

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
          </div>
        )}

        <div className="grid min-w-0 content-start gap-2">
          <Label
            htmlFor={`${prefix}-name`}
            className="flex min-h-11 items-end pb-1"
          >
            {t("name")}
          </Label>

          <Input
            id={`${prefix}-name`}
            name="name"
            defaultValue={discount?.name}
            required
            maxLength={120}
          />
        </div>

        <div className="grid min-w-0 content-start gap-2">
          <Label
            htmlFor={`${prefix}-kind`}
            className="flex min-h-11 items-end pb-1"
          >
            {t("discountType")}
          </Label>

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
        </div>

        <div className="grid min-w-0 content-start gap-2">
          <Label
            htmlFor={`${prefix}-value`}
            className="flex min-h-11 items-end pb-1"
          >
            {t(kind === "Percentage" ? "percentageValue" : "fixedValue", {
              currency,
            })}
          </Label>

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
        </div>

        <div className="grid min-w-0 content-start gap-2">
          <Label
            htmlFor={`${prefix}-minimum-order`}
            className="flex min-h-11 items-end pb-1"
          >
            {t("minimumOrderAmount", { currency })}
          </Label>

          <Input
            id={`${prefix}-minimum-order`}
            name="minimumOrderAmount"
            type="number"
            min="0"
            max="9999999999.99"
            step="0.01"
            defaultValue={discount?.minimumOrderAmount.toFixed(2) ?? "0.00"}
            required
          />
        </div>

        <div className="grid min-w-0 content-start gap-2">
          <Label
            htmlFor={`${prefix}-expires-on`}
            className="flex min-h-11 items-end pb-1"
          >
            {t("discountExpiresOn")}
          </Label>

          <Input
            id={`${prefix}-expires-on`}
            name="expiresOn"
            type="date"
            defaultValue={discount?.expiresOn ?? ""}
          />
        </div>

        <EditorFormActions
          pending={pending}
          onCancel={onCancel}
          label={
            pending ? t("saving") : discount ? t("save") : t("createDiscount")
          }
        />
      </fieldset>

      <ResultMessage state={state} message={feedback} hideSuccess />
    </form>
  )
}
