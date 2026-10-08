"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { validProductSelection } from "@/lib/checkout/cart"
import type { CartItem } from "@/types/checkout"
import type { Product } from "@/types/storefront"
import { useTranslations } from "next-intl"

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
  const [open, setOpen] = useState(false)
  const [optionIds, setOptionIds] = useState<string[]>(item?.optionIds ?? [])
  const [quantity, setQuantity] = useState(item?.quantity ?? 1)
  const [selectionError, setSelectionError] = useState(false)

  function showDialog(next: boolean) {
    if (next) {
      setOptionIds(item?.optionIds ?? [])
      setQuantity(item?.quantity ?? 1)
      setSelectionError(false)
    }

    setOpen(next)
  }

  function save() {
    if (!validProductSelection(product, optionIds)) {
      setSelectionError(true)

      return
    }

    onSave({ productId: product.id, quantity, optionIds })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={showDialog}>
      <DialogTrigger
        disabled={locked}
        aria-label={
          item
            ? t("editProduct", { product: product.name })
            : t("addProduct", { product: product.name })
        }
        render={
          <Button
            type="button"
            variant={item ? "outline" : "default"}
            className="mt-4 min-h-11"
          />
        }
      >
        {item ? t("editChoices") : t("addToOrder")}
      </DialogTrigger>

      <DialogContent aria-labelledby={`product-dialog-title-${product.id}`}>
        <header className="shrink-0 border-b border-border p-5 sm:p-6">
          <DialogTitle
            id={`product-dialog-title-${product.id}`}
            className="text-xl font-semibold"
          >
            {product.name}
          </DialogTitle>

          <DialogDescription className="mt-2">
            {product.description ?? t("chooseOptions")}
          </DialogDescription>
        </header>

        <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
          <div className="grid gap-6">
            {product.optionGroups.map((group) => (
              <fieldset key={group.id} className="grid gap-3">
                <legend className="mb-1 font-semibold">
                  {group.name}

                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {t("selectionRule", {
                      min: group.minimumSelections,
                      max: group.maximumSelections,
                    })}
                  </span>
                </legend>

                {group.options.map((option) => (
                  <Label
                    key={option.id}
                    className="flex min-h-11 items-center justify-between gap-4 rounded-md border border-border px-3 py-2"
                  >
                    <span className="flex items-center gap-3">
                      <Checkbox
                        aria-label={option.name}
                        checked={optionIds.includes(option.id)}
                        onCheckedChange={(checked) => {
                          const next = checked
                            ? [...optionIds, option.id]
                            : optionIds.filter((id) => id !== option.id)

                          setOptionIds(next)
                          setSelectionError(false)
                        }}
                      />

                      {option.name}
                    </span>

                    {option.priceAdjustment !== 0 && (
                      <span className="text-sm text-muted-foreground tabular-nums">
                        +{price.format(option.priceAdjustment)}
                      </span>
                    )}
                  </Label>
                ))}
              </fieldset>
            ))}

            {selectionError && (
              <p role="alert" className="text-sm text-destructive">
                {t("invalidOptions")}
              </p>
            )}

            <Label className="grid w-fit gap-1.5 font-medium">
              {t("quantity")}

              <Input
                type="number"
                min={1}
                max={99}
                step={1}
                required
                value={quantity}
                aria-label={t("quantityFor", { product: product.name })}
                className="w-24"
                onChange={(event) => {
                  const next = Number(event.target.value)

                  if (Number.isInteger(next) && next >= 1 && next <= 99)
                    setQuantity(next)
                }}
              />
            </Label>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-4 sm:p-5">
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t("cancel")}
          </DialogClose>

          <Button type="button" onClick={save}>
            {item
              ? t("saveChanges")
              : t("addProduct", { product: product.name })}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
