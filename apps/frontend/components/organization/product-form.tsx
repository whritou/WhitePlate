"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { saveProductAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { EditorFormActions } from "@/components/ui/editor-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useCatalogForm } from "./use-catalog-form"
import { ProductCategoryField } from "./product-category-field"
import type { ProductFormProps } from "@/types/catalog-management"

export function ProductForm({
  tenantId,
  currency,
  categories,
  product,
  onSuccess,
  onPendingChange,
  onCancel,
  studio,
  onDirtyChange,
}: ProductFormProps) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(
    saveProductAction,
    !product,
    onSuccess,
    undefined,
    onPendingChange
  )
  const prefix = product?.id ?? "new-product"
  const [categoryPending, setCategoryPending] = useState(false)

  return (
    <form
      onSubmit={submit}
      onChange={(event) => {
        if (event.currentTarget.contains(event.target as Node))
          onDirtyChange?.()
      }}
      aria-label={
        product ? t("editProduct", { name: product.name }) : t("newProduct")
      }
      className="grid gap-4"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      {product && <input type="hidden" name="id" value={product.id} />}

      <fieldset
        disabled={pending || categoryPending}
        className={
          studio
            ? "grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4"
            : "grid min-w-0 gap-4 sm:grid-cols-2"
        }
      >
        <ProductCategoryField
          tenantId={tenantId}
          categories={categories}
          initialId={product?.categoryId}
          prefix={prefix}
          onCreated={onDirtyChange}
          onPendingChange={(value) => {
            setCategoryPending(value)
            onPendingChange?.(value)
          }}
        />

        <Label
          htmlFor={`${prefix}-name`}
          className={
            studio ? "grid gap-2 sm:col-span-2 xl:col-span-4" : "grid gap-2"
          }
        >
          {t("name")}

          <Input
            id={`${prefix}-name`}
            name="name"
            defaultValue={product?.name}
            required
            maxLength={160}
          />
        </Label>

        <Label
          htmlFor={`${prefix}-description`}
          className={
            studio
              ? "grid gap-2 sm:col-span-2 xl:col-span-4"
              : "grid gap-2 sm:col-span-2"
          }
        >
          {t("description")}

          <Textarea
            id={`${prefix}-description`}
            name="description"
            defaultValue={product?.description ?? ""}
            maxLength={1000}
            rows={4}
          />
        </Label>

        <Label htmlFor={`${prefix}-price`} className="grid gap-2">
          {t("price", { currency })}

          <Input
            id={`${prefix}-price`}
            name="basePrice"
            type="number"
            min={0}
            max={9999999999.99}
            step="0.01"
            defaultValue={product?.basePrice.toFixed(2) ?? "0.00"}
            required
          />
        </Label>

        <Label htmlFor={`${prefix}-tax`} className="grid gap-2">
          {t("tax")}

          <Input
            id={`${prefix}-tax`}
            name="taxRatePercent"
            type="number"
            min={0}
            max={100}
            step="0.01"
            defaultValue={product?.taxRatePercent.toFixed(2) ?? "0.00"}
            required
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
            defaultValue={product?.sortOrder ?? 0}
            required
          />
        </Label>

        {product && (
          <Label htmlFor={`${prefix}-availability`} className="grid gap-2">
            {t("availability")}

            <NativeSelect
              id={`${prefix}-availability`}
              name="isAvailable"
              aria-label={t("availability")}
              defaultValue={String(product.isAvailable)}
            >
              <NativeSelectOption value="true">
                {t("available")}
              </NativeSelectOption>

              <NativeSelectOption value="false">
                {t("unavailable")}
              </NativeSelectOption>
            </NativeSelect>
          </Label>
        )}

        <EditorFormActions
          className={studio ? "xl:col-span-4" : undefined}
          pending={pending}
          onCancel={onCancel}
          label={
            pending ? t("saving") : product ? t("save") : t("createProduct")
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
