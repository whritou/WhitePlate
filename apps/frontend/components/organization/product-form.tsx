"use client"

import { useTranslations } from "next-intl"
import { saveProductAction } from "@/actions/catalog"
import { ResultMessage } from "@/components/auth/result-message"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useCatalogForm } from "./use-catalog-form"
import type { ProductFormProps } from "@/types/catalog-management"

export function ProductForm({
  tenantId,
  currency,
  categories,
  product,
}: ProductFormProps) {
  const t = useTranslations("Catalog")
  const { pending, state, submit } = useCatalogForm(saveProductAction, !product)
  const prefix = product?.id ?? "new-product"
  const activeCategories = categories.filter((category) => !category.isArchived)

  if (!product && activeCategories.length === 0)
    return (
      <p className="text-sm text-muted-foreground">{t("categoryRequired")}</p>
    )

  return (
    <form
      onSubmit={submit}
      aria-label={
        product ? t("editProduct", { name: product.name }) : t("newProduct")
      }
      className="grid gap-4"
    >
      <input type="hidden" name="tenantId" value={tenantId} />

      {product && <input type="hidden" name="id" value={product.id} />}

      {product && (
        <input type="hidden" name="categoryId" value={product.categoryId} />
      )}

      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        {!product && (
          <Label htmlFor={`${prefix}-category`} className="grid gap-2">
            {t("category")}

            <NativeSelect
              id={`${prefix}-category`}
              name="categoryId"
              aria-label={t("category")}
              defaultValue={activeCategories[0].id}
            >
              {activeCategories.map((category) => (
                <NativeSelectOption key={category.id} value={category.id}>
                  {category.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Label>
        )}

        <Label htmlFor={`${prefix}-name`} className="grid gap-2">
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
          className="grid gap-2 sm:col-span-2"
        >
          {t("description")}

          <Input
            id={`${prefix}-description`}
            name="description"
            defaultValue={product?.description ?? ""}
            maxLength={1000}
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

        <Button type="submit">
          {pending ? t("saving") : product ? t("save") : t("createProduct")}
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
