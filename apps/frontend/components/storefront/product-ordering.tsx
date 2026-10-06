"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { validProductSelection } from "@/lib/checkout/cart"
import { cn } from "@/lib/utils"
import type { CartItem } from "@/types/checkout"
import type { Product } from "@/types/storefront"
import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"

const inputClass = "w-full"

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
            <legend className="mb-2 text-base font-medium">
              {group.name}{" "}
              <span className="font-normal text-muted-foreground">
                {t("selectionRule", {
                  min: group.minimumSelections,
                  max: group.maximumSelections,
                })}
              </span>
            </legend>

            {group.options.map((option) => (
              <Label
                key={option.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    aria-label={option.name}
                    disabled={locked}

                    checked={chosen.includes(option.id)}
                    onCheckedChange={(checked) => {
                      const next = checked
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
              </Label>
            ))}
          </fieldset>
        ))}

        {selectionError && (
          <p role="alert" className="text-sm text-destructive">
            {t("invalidOptions")}
          </p>
        )}

        {item ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("inCart", { count: item.quantity })}
          </p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <Label className="grid gap-1 font-medium">
              {t("quantity")}

              <Input
                type="number"
                min={1}
                max={99}
                required
                value={quantity}
                aria-label={t("quantityFor", { product: product.name })}
                className={cn(inputClass, "w-20")}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
            </Label>

            <Button type="submit" size="lg" disabled={locked}>
              {t("addProduct", { product: product.name })}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  )
}
