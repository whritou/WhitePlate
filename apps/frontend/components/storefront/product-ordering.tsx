"use client"

import { useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { StorefrontMenu } from "@/lib/api/public-storefront"
import { validProductSelection, type CartItem } from "@/lib/checkout/cart"

type Product = StorefrontMenu["categories"][number]["products"][number]
const inputClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function ProductOrdering({
  product,
  item,
  locked,
  price,
  onSave,
}: {
  product: Product
  item?: CartItem
  locked: boolean
  price: Intl.NumberFormat
  onSave: (item: CartItem) => void
}) {
  const t = useTranslations("Checkout")
  const locale = useLocale()
  const [optionIds, setOptionIds] = useState<string[]>([])
  const [quantity, setQuantity] = useState(1)
  const [selectionError, setSelectionError] = useState(false)
  const chosen = item?.optionIds ?? optionIds
  return (
    <form
      lang={locale}
      className="mt-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (!validProductSelection(product, chosen)) {
          setSelectionError(true)
          return
        }
        onSave({
          productId: product.id,
          quantity: item?.quantity ?? quantity,
          optionIds: chosen,
        })
        setSelectionError(false)
      }}
    >
      <fieldset disabled={locked} className="grid gap-4">
        {product.optionGroups.map((group) => (
          <fieldset key={group.id} className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">
              {group.name}{" "}
              <span className="font-normal text-muted-foreground">
                {t("selectionRule", {
                  min: group.minimumSelections,
                  max: group.maximumSelections,
                })}
              </span>
            </legend>
            {group.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={chosen.includes(option.id)}
                    onChange={(event) => {
                      const next = event.target.checked
                        ? [...chosen, option.id]
                        : chosen.filter((id) => id !== option.id)
                      setSelectionError(false)
                      if (item) onSave({ ...item, optionIds: next })
                      else setOptionIds(next)
                    }}
                  />
                  {option.name}
                </span>
                <span className="tabular-nums">
                  {option.priceAdjustment
                    ? `+${price.format(option.priceAdjustment)}`
                    : ""}
                </span>
              </label>
            ))}
          </fieldset>
        ))}
        {selectionError && (
          <p role="alert" className="text-sm text-destructive">
            {t("invalidOptions")}
          </p>
        )}
        {item ? (
          <p role="status" className="text-xs text-muted-foreground">
            {t("inCart", { count: item.quantity })}
          </p>
        ) : (
          <div className="flex items-end gap-3">
            <label className="grid gap-1 text-xs font-medium">
              {t("quantity")}
              <input
                type="number"
                min={1}
                max={99}
                required
                value={quantity}
                aria-label={t("quantityFor", { product: product.name })}
                className={cn(inputClass, "w-20")}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </label>
            <Button type="submit" size="lg" disabled={locked}>
              {t("addProduct", { product: product.name })}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  )
}
