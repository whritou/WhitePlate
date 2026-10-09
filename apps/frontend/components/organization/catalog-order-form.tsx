"use client"

import { Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { saveCategoryAction, saveProductAction } from "@/actions/catalog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResultMessage } from "@/components/auth/result-message"
import type {
  CatalogCategory,
  CatalogProduct,
} from "@/types/catalog-management"
import { useCatalogForm } from "./use-catalog-form"

export function CatalogOrderForm({
  tenantId,
  item,
  pending: busy,
  onPendingChange,
}: {
  tenantId: string
  item: CatalogCategory | CatalogProduct
  pending: boolean
  onPendingChange: (pending: boolean) => void
}) {
  const t = useTranslations("Catalog")
  const u = useTranslations("MenuBuilder")
  const product = "categoryId" in item ? item : undefined
  const { pending, state, submit } = useCatalogForm(
    product ? saveProductAction : saveCategoryAction,
    false,
    undefined,
    undefined,
    onPendingChange
  )

  return (
    <form onSubmit={submit} className="grid gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />

      <input type="hidden" name="id" value={item.id} />

      <input type="hidden" name="name" value={item.name} />

      {product && (
        <>
          <input type="hidden" name="categoryId" value={product.categoryId} />

          <input
            type="hidden"
            name="description"
            value={product.description ?? ""}
          />

          <input
            type="hidden"
            name="basePrice"
            value={product.basePrice.toFixed(2)}
          />

          <input
            type="hidden"
            name="taxRatePercent"
            value={product.taxRatePercent.toFixed(2)}
          />

          <input
            type="hidden"
            name="isAvailable"
            value={String(product.isAvailable)}
          />
        </>
      )}

      <fieldset disabled={busy || pending} className="flex items-center gap-2">
        <Label htmlFor={`order-${item.id}`} className="sr-only">
          {u("orderFor", { name: item.name })}
        </Label>

        <Input
          key={item.sortOrder}
          id={`order-${item.id}`}
          name="sortOrder"
          type="number"
          min={0}
          max={2147483647}
          step={1}
          required
          defaultValue={item.sortOrder}
          className="w-20"
        />

        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label={u("saveOrderFor", { name: item.name })}
          aria-busy={pending}
        >
          <Save aria-hidden="true" className="size-4" />
        </Button>
      </fieldset>

      <ResultMessage
        state={state}
        hideSuccess
        message={t(`errors.${state.error ?? "unavailable"}`)}
      />
    </form>
  )
}
