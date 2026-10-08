"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { CheckoutPanelProps } from "@/types/checkout"
import { useTranslations } from "next-intl"
import { Receipt } from "./receipt"

export function CheckoutPanel({
  checkoutState,
  mode,
  estimatedSubtotal,
  onBack,
  onContinue,
  onNewOrder,
}: CheckoutPanelProps) {
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
    trackingToken,
    changeCart,
    checkout,
    changeCustomerName,
    changeDiscountCode,
  } = checkoutState
  const quantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  const uncertain = error === "unavailable"
  const c = useTranslations("Checkout")
  const t = useTranslations("Storefront")
  const isCart = mode === "cart"

  return (
    <section
      aria-labelledby="cart-heading"
      className={isCart ? "lg:sticky lg:top-6" : "lg:sticky lg:top-24"}
    >
      <Card className="gap-0 p-6 text-base has-data-[slot=card-footer]:pb-6 sm:p-8">
        {receipt ? (
          <>
            <Receipt receipt={receipt} trackingToken={trackingToken} />

            <CardFooter className="border-0 p-0">
              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full"
                onClick={onNewOrder}
              >
                {c("newOrder")}
              </Button>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="px-0">
              <CardTitle>
                <h2 id="cart-heading" className="text-xl font-semibold">
                  {isCart ? c("cartTitle") : c("checkoutTitle")}
                </h2>
              </CardTitle>

              <CardDescription className="mt-1 text-sm">
                {isCart
                  ? c("cartCount", { count: quantity })
                  : c("checkoutDescription")}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0">
              {cart.length === 0 ? (
                <div className="my-6 grid gap-3">
                  <p className="text-sm text-muted-foreground">
                    {c("emptyCart")}
                  </p>

                  {!isCart && onBack && (
                    <Button type="button" variant="outline" onClick={onBack}>
                      {c("backToMenu")}
                    </Button>
                  )}
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-border">
                  {cart.map((item) => {
                    const product = products.find(
                      (product) => product.id === item.productId
                    )
                    const options =
                      product?.optionGroups
                        .flatMap((group) => group.options)
                        .filter((option) =>
                          item.optionIds.includes(option.id)
                        ) ?? []

                    return (
                      <li key={item.productId} className="py-4 first:pt-0">
                        <p className="font-medium">
                          {product?.name ?? t("unavailableProduct")}
                        </p>

                        {options.length > 0 && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {options.map((option) => option.name).join(", ")}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <Label className="flex items-center gap-2">
                            {c("quantity")}

                            <Input
                              type="number"
                              min={1}
                              max={99}
                              step={1}
                              value={item.quantity}
                              disabled={locked}
                              aria-label={c("quantityFor", {
                                product:
                                  product?.name ?? t("unavailableProduct"),
                              })}
                              className="w-20"
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

              {cart.length > 0 && (
                <>
                  {isCart && estimatedSubtotal && (
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
                      <span>{c("estimatedSubtotal")}</span>

                      <span className="tabular-nums">{estimatedSubtotal}</span>
                    </div>
                  )}

                  <p className="mt-3 text-sm leading-5 text-muted-foreground">
                    {c("priceNote")}
                  </p>
                </>
              )}

              {isCart ? (
                <Button
                  type="button"
                  size="lg"
                  className="mt-5 w-full"
                  disabled={cart.length === 0}
                  onClick={onContinue}
                >
                  {c("continueToCheckout")}
                </Button>
              ) : cart.length > 0 ? (
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
                      className="grid gap-1.5 font-medium"
                      htmlFor="customer-name"
                    >
                      {c("customerName")}

                      <Input
                        id="customer-name"
                        name="customerName"
                        autoComplete="name"
                        maxLength={200}
                        required
                        value={customerName}
                        onChange={(event) =>
                          changeCustomerName(event.target.value)
                        }
                      />
                    </Label>

                    <Label
                      className="grid gap-1.5 font-medium"
                      htmlFor="discount-code"
                    >
                      {c("discountCode")}

                      <Input
                        id="discount-code"
                        name="discountCode"
                        maxLength={64}
                        value={discountCode}
                        onChange={(event) =>
                          changeDiscountCode(event.target.value)
                        }
                      />
                    </Label>
                  </fieldset>

                  {error && (
                    <Alert variant="destructive" role="alert">
                      <AlertDescription>
                        {c(`errors.${error}`)}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={
                      submitting || changingLanguage || cart.length === 0
                    }
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

                  {onBack && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={locked}
                      onClick={onBack}
                    >
                      {c("backToMenu")}
                    </Button>
                  )}
                </form>
              ) : null}
            </CardContent>

            {isCart && (
              <CardFooter className="border-0 p-0">
                <p className="mt-4 text-sm leading-5 text-muted-foreground">
                  {c("visitOnly")}
                </p>
              </CardFooter>
            )}
          </>
        )}
      </Card>
    </section>
  )
}
