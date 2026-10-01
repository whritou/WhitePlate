"use client"

import { Alert } from "@/components/ui/alert"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Receipt } from "./receipt"
import type { CheckoutPanelProps } from "@/types/checkout"

export function CheckoutPanel({ checkoutState }: CheckoutPanelProps) {
  const {
    cart,
    customerName,
    discountCode,
    error,
    submitting,
    receipt,
    changingLanguage,
    locked,
    products,
    changeCart,
    checkout,
    startNewOrder,
    changeCustomerName,
    changeDiscountCode,
  } = checkoutState
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const uncertain = error === "unavailable"
  const c = useTranslations("Checkout")
  const t = useTranslations("Storefront")
  return (
    <aside
      aria-labelledby="cart-heading"
      className="rounded-lg border border-border bg-card p-5 lg:sticky lg:top-6"
    >
      {receipt ? (
        <>
          <Receipt receipt={receipt} />
          <Button
            type="button"
            variant="outline"
            className="mt-5 w-full"
            onClick={startNewOrder}
          >
            {c("newOrder")}
          </Button>
        </>
      ) : (
        <>
          <h2 id="cart-heading" className="text-xl font-semibold">
            {c("cartTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {c("cartCount", { count: quantity })}
          </p>
          {cart.length === 0 ? (
            <p className="my-6 text-sm text-muted-foreground">
              {c("emptyCart")}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {cart.map((item) => {
                const product = products.find(
                  (product) => product.id === item.productId
                )
                const options =
                  product?.optionGroups
                    .flatMap((group) => group.options)
                    .filter((option) => item.optionIds.includes(option.id)) ??
                  []
                return (
                  <li key={item.productId} className="py-4">
                    <p className="font-medium">
                      {product?.name ?? t("unavailableProduct")}
                    </p>
                    {options.length > 0 && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {options.map((option) => option.name).join(", ")}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <Label className="flex items-center gap-2 text-sm">
                        {c("quantity")}
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          step={1}
                          value={item.quantity}
                          disabled={locked}
                          aria-label={c("quantityFor", {
                            product: product?.name ?? t("unavailableProduct"),
                          })}
                          className={"h-10 w-16 rounded-md"}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            if (
                              Number.isInteger(value) &&
                              value >= 1 &&
                              value <= 99
                            )
                              changeCart({ ...item, quantity: value })
                          }}
                        />
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={locked}
                        aria-label={c("removeProduct", {
                          product: product?.name ?? t("unavailableProduct"),
                        })}
                        onClick={() => changeCart({ ...item, quantity: 0 })}
                      >
                        {c("remove")}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {c("priceNote")}
          </p>
          <form
            onSubmit={checkout}
            className="mt-5 grid gap-4"
            aria-busy={submitting}
          >
            <fieldset
              disabled={locked || cart.length === 0}
              className="grid gap-4"
            >
              <Label
                className="grid gap-1.5 text-sm font-medium"
                htmlFor="customer-name"
              >
                {c("customerName")}
                <Input
                  id="customer-name"
                  name="customerName"
                  autoComplete="name"
                  maxLength={200}
                  required
                  className="h-10 rounded-md"
                  value={customerName}
                  onChange={(event) => changeCustomerName(event.target.value)}
                />
              </Label>
              <Label
                className="grid gap-1.5 text-sm font-medium"
                htmlFor="discount-code"
              >
                {c("discountCode")}
                <Input
                  id="discount-code"
                  name="discountCode"
                  maxLength={64}
                  className="h-10 rounded-md"
                  value={discountCode}
                  onChange={(event) => changeDiscountCode(event.target.value)}
                />
              </Label>
            </fieldset>
            {error && (
              <Alert
                variant="destructive"
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {c(`errors.${error}`)}
              </Alert>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting || changingLanguage || cart.length === 0}
            >
              {submitting
                ? c("placingOrder")
                : uncertain
                  ? c("retryOrder")
                  : c("placeOrder")}
            </Button>
            {submitting && (
              <p role="status" className="text-sm text-muted-foreground">
                {c("placingOrder")}
              </p>
            )}
          </form>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {c("visitOnly")}
          </p>
        </>
      )}
    </aside>
  )
}
